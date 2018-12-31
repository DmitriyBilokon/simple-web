node('master'){
        stage('Build') {
                checkout scm
                echo 'Building..'
                sh 'echo $USER'
                sh 'docker build -t simple-web -f Dockerfile .'               

        }
        stage('Test') {

                echo 'Testing..' 
                docker_result = sh returnStdout: true, script: 'docker ps -aq'
                echo "$docker_result"
                try{
                        sh "docker rm -f $docker_result"
                }
                catch (error){
          
                }
                sh 'docker run -d -p 4000:80 simple-web'
                sleep(3)
                def result
                try{
                        result = sh returnStatus: true, script: 'curl -v localhost:4000'
                }
                catch (error){
          
                }
                echo "$result"
                docker_result = sh returnStdout: true, script: 'docker ps -aq'
                echo "$docker_result"
                try{
                        sh "docker rm -f $docker_result"
                }
                catch (error){
          
                }
                if (result == 18){
                        echo "test ok"
                }
                else{
                        echo "test nok"
                        throw "test nok"
                }
                
        }
        stage('Deploy') {
                echo 'Deploying....'
                sh "docker tag simple-web:latest us.gcr.io/gitdocker/simple-web:${env.BUILD_NUMBER}"
                sh "docker push us.gcr.io/gitdocker/simple-web:${env.BUILD_NUMBER}"
                sh "docker tag simple-web:latest us.gcr.io/gitdocker/simple-web:latest"
                sh "docker push us.gcr.io/gitdocker/simple-web:latest"
        }
        
        stage('Create KudeClusters') {
        echo 'Create Kube Clusters...'
        sh 'gcloud config set project gitdocker'
        sh "gcloud container clusters create simple-web-${env.BUILD_NUMBER} --zone us-central1-a --num-nodes 2"
        sh 'kubectl apply -f Deployment.yaml'
        
        }
}
