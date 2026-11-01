# =============================================================
# RAIZ DO NOME · imagem do app (Nginx Alpine)
# Build: docker build -t raiz-do-nome .
# Rodar: docker run -d -p 8080:80 --name raiz-do-nome raiz-do-nome
# =============================================================

FROM nginx:alpine

# ========== Configuração do servidor ==========
# gzip, cabeçalhos de segurança e cache (ver nginx.conf)
COPY --chmod=644 nginx.conf /etc/nginx/conf.d/default.conf

# ========== Arquivos estáticos do app ==========
# utils.js entra junto porque o script.js importa as funções dele.
# --chmod=644 garante que o Nginx consiga ler os arquivos, mesmo que
# na máquina de quem fez o build eles estejam só com permissão do dono
COPY --chmod=644 index.html style.css script.js utils.js /usr/share/nginx/html/

# ========== Saúde do container ==========
# O docker ps mostra "healthy" quando o Nginx responde à página inicial
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

EXPOSE 80