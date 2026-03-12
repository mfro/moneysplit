npm run build
docker build --tag "$MFRO_DEPLOY_REGISTRY/moneysplit" --push .
ssh "$MFRO_DEPLOY_HOST" "cd server; sudo docker compose up --detach --pull always"
