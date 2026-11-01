# =============================================================
# RAIZ DO NOME · imagem do app (Nginx Alpine)
# Build: docker build -t raiz-do-nome .
# Rodar: docker run -d -p 8080:80 --name raiz-do-nome raiz-do-nome
# =============================================================

FROM nginx:alpine

# ========== Arquivos estáticos do app ==========
# utils.js entra junto porque o script.js importa as funções dele.
# --chmod=644 garante que o Nginx consiga ler os arquivos, mesmo que
# na máquina de quem fez o build eles estejam só com permissão do dono
COPY --chmod=644 index.html style.css script.js utils.js /usr/share/nginx/html/

EXPOSE 80
