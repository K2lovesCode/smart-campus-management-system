terraform {
  required_version = ">= 1.5.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.31"
    }
  }
}

# Points at your existing kubeconfig (Docker Desktop, minikube, kind, or a cloud cluster).
provider "kubernetes" {
  config_path    = var.kubeconfig_path
  config_context = var.kube_context
}
