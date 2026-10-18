variable "kubeconfig_path" {
  description = "Path to the kubeconfig file"
  type        = string
  default     = "~/.kube/config"
}

variable "kube_context" {
  description = "Kubeconfig context to use (e.g. docker-desktop, minikube)"
  type        = string
  default     = "docker-desktop"
}

variable "namespace" {
  description = "Kubernetes namespace for the application"
  type        = string
  default     = "smart-campus"
}

variable "backend_image" {
  description = "Backend container image"
  type        = string
  default     = "smart-campus-backend:latest"
}

variable "frontend_image" {
  description = "Frontend container image"
  type        = string
  default     = "smart-campus-frontend:latest"
}

variable "backend_replicas" {
  description = "Number of backend replicas"
  type        = number
  default     = 2
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
  default     = "replace_me_with_a_long_random_secret"
}
