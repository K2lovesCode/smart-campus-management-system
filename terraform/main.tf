# Provisions the Smart Campus application onto a Kubernetes cluster as code.
# This demonstrates Infrastructure-as-Code: the same resources defined in k8s/
# manifests, expressed through Terraform so they can be versioned and automated.

resource "kubernetes_namespace" "campus" {
  metadata {
    name = var.namespace
    labels = {
      app = "smart-campus"
    }
  }
}

resource "kubernetes_config_map" "backend" {
  metadata {
    name      = "backend-config"
    namespace = kubernetes_namespace.campus.metadata[0].name
  }
  data = {
    NODE_ENV             = "production"
    PORT                 = "5000"
    MONGO_URI            = "mongodb://mongo:27017/smart_campus"
    JWT_EXPIRES_IN       = "1d"
    ATTENDANCE_THRESHOLD = "75"
    CLIENT_ORIGIN        = "*"
  }
}

resource "kubernetes_secret" "backend" {
  metadata {
    name      = "backend-secret"
    namespace = kubernetes_namespace.campus.metadata[0].name
  }
  data = {
    JWT_SECRET = var.jwt_secret
  }
  type = "Opaque"
}

# --- MongoDB (StatefulSet + headless Service + PVC) ---
resource "kubernetes_persistent_volume_claim" "mongo" {
  metadata {
    name      = "mongo-pvc"
    namespace = kubernetes_namespace.campus.metadata[0].name
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "1Gi"
      }
    }
  }
  wait_until_bound = false
}

resource "kubernetes_stateful_set" "mongo" {
  metadata {
    name      = "mongo"
    namespace = kubernetes_namespace.campus.metadata[0].name
  }
  spec {
    service_name = "mongo"
    replicas     = 1
    selector {
      match_labels = { app = "mongo" }
    }
    template {
      metadata {
        labels = { app = "mongo" }
      }
      spec {
        container {
          name  = "mongo"
          image = "mongo:7"
          port {
            container_port = 27017
          }
          volume_mount {
            name       = "mongo-storage"
            mount_path = "/data/db"
          }
        }
        volume {
          name = "mongo-storage"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.mongo.metadata[0].name
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "mongo" {
  metadata {
    name      = "mongo"
    namespace = kubernetes_namespace.campus.metadata[0].name
  }
  spec {
    selector   = { app = "mongo" }
    cluster_ip = "None"
    port {
      port        = 27017
      target_port = 27017
    }
  }
}

# --- Backend ---
resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.campus.metadata[0].name
    labels    = { app = "backend" }
  }
  spec {
    replicas = var.backend_replicas
    selector {
      match_labels = { app = "backend" }
    }
    template {
      metadata {
        labels = { app = "backend" }
        annotations = {
          "prometheus.io/scrape" = "true"
          "prometheus.io/port"   = "5000"
          "prometheus.io/path"   = "/metrics"
        }
      }
      spec {
        container {
          name              = "backend"
          image             = var.backend_image
          image_pull_policy = "IfNotPresent"
          port {
            container_port = 5000
          }
          env_from {
            config_map_ref {
              name = kubernetes_config_map.backend.metadata[0].name
            }
          }
          env_from {
            secret_ref {
              name = kubernetes_secret.backend.metadata[0].name
            }
          }
          readiness_probe {
            http_get {
              path = "/ready"
              port = 5000
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }
          liveness_probe {
            http_get {
              path = "/health"
              port = 5000
            }
            initial_delay_seconds = 20
            period_seconds        = 15
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.campus.metadata[0].name
  }
  spec {
    selector = { app = "backend" }
    port {
      port        = 5000
      target_port = 5000
    }
  }
}

# --- Frontend ---
resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.campus.metadata[0].name
    labels    = { app = "frontend" }
  }
  spec {
    replicas = 2
    selector {
      match_labels = { app = "frontend" }
    }
    template {
      metadata {
        labels = { app = "frontend" }
      }
      spec {
        container {
          name              = "frontend"
          image             = var.frontend_image
          image_pull_policy = "IfNotPresent"
          port {
            container_port = 80
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.campus.metadata[0].name
  }
  spec {
    selector = { app = "frontend" }
    type     = "NodePort"
    port {
      port        = 80
      target_port = 80
      node_port   = 30080
    }
  }
}
