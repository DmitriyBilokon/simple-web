pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building..'
                sh 'echo $USER'
                sh 'docker build -t simple-web -f Dockerfile .'               
            }
        }
        stage('Test') {
            steps {
                echo 'Testing..'              
                sh 'docker stop $(docker ps -q)'
                sh 'docker run -d -p 80:80 simple-web'
                sh 'curl localhost:80'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
}
