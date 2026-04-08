# Usar la imagen base nginx:alpine para Google Cloud Run
FROM nginx:alpine

# Copiar los archivos estáticos a la carpeta de Nginx
COPY index.html style.css app.js /usr/share/nginx/html/

# Copiar la configuración personalizada de Nginx con puerto 8080
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer el puerto 8080 (requerido por Google Cloud Run)
EXPOSE 8080

# Iniciar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
