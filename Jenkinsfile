// Jenkins pipeline for the Smart Campus Management System.
// Demonstrates a Maven-driven build in a Jenkins + Maven setup (common in
// college DevOps labs). The Maven build wraps the npm toolchain via
// frontend-maven-plugin, so "Maven" builds the Node/React app.
pipeline {
  agent any

  tools {
    // Configure a Maven installation named "M3" in Jenkins > Global Tool Config.
    maven 'M3'
  }

  environment {
    REGISTRY        = 'ghcr.io'
    BACKEND_IMAGE   = 'smart-campus-backend'
    FRONTEND_IMAGE  = 'smart-campus-frontend'
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build (Maven wraps npm)') {
      steps {
        sh 'mvn -B clean package'
      }
    }

    stage('Test') {
      steps {
        dir('backend') {
          sh 'npm install'
          sh 'npm test --if-present'
        }
      }
    }

    stage('Docker Build') {
      steps {
        sh 'docker build -t $BACKEND_IMAGE:$BUILD_NUMBER ./backend'
        sh 'docker build -t $FRONTEND_IMAGE:$BUILD_NUMBER ./frontend'
      }
    }

    stage('Deploy to Kubernetes') {
      when { branch 'main' }
      steps {
        sh 'kubectl apply -f k8s/'
        sh 'kubectl -n smart-campus rollout restart deployment/backend deployment/frontend'
      }
    }
  }

  post {
    success { echo 'Pipeline completed successfully.' }
    failure { echo 'Pipeline failed — check the stage logs.' }
  }
}
