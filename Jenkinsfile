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
                out = sh (script: 'docker ps -q', returnStdout: true )
                print $out
                sh 'docker stop ${out}'
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
