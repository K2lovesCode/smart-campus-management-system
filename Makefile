# Convenience targets for the Smart Campus Management System.
.PHONY: help install dev build up down seed k8s-deploy k8s-delete tf-apply

help:
	@echo "Targets:"
	@echo "  install     Install backend + frontend dependencies"
	@echo "  dev         Run backend and frontend in dev mode (two terminals recommended)"
	@echo "  up          Start the full stack with Docker Compose"
	@echo "  down        Stop the Docker Compose stack"
	@echo "  seed        Seed demo data into the running backend container"
	@echo "  k8s-deploy  Apply Kubernetes manifests"
	@echo "  k8s-delete  Delete the Kubernetes namespace"
	@echo "  tf-apply    Provision via Terraform"

install:
	cd backend && npm install
	cd frontend && npm install

build:
	mvn -B clean package

up:
	docker compose up --build -d

down:
	docker compose down

seed:
	docker compose exec backend node src/seed.js

k8s-deploy:
	kubectl apply -f k8s/

k8s-delete:
	kubectl delete namespace smart-campus

tf-apply:
	cd terraform && terraform init && terraform apply -auto-approve
