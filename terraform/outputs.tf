output "namespace" {
  description = "Namespace the app is deployed into"
  value       = kubernetes_namespace.campus.metadata[0].name
}

output "frontend_node_port" {
  description = "NodePort to reach the frontend (http://localhost:<port>)"
  value       = kubernetes_service.frontend.spec[0].port[0].node_port
}

output "backend_service" {
  description = "In-cluster backend service DNS name"
  value       = "${kubernetes_service.backend.metadata[0].name}.${kubernetes_namespace.campus.metadata[0].name}.svc.cluster.local:5000"
}
