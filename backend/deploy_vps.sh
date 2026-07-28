
echo "=== Connexion et deploiement sur le VPS ==="
ssh -o StrictHostKeyChecking=no root@102.204.205.48 << 'EOF'
75BZ8aZHSPfO
cd /var/www/kort-interiors
git fetch origin
git checkout fix-socialM
git pull origin fix-socialM
cd backend
npm run build
cd ../frontend
npm run build
pm2 restart all
exit
EOF
