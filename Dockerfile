# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

COPY . .

# Build-time variable for Vite
ARG VITE_API_TARGET
ENV VITE_API_TARGET=${VITE_API_TARGET}

RUN echo "Building with API: ${VITE_API_TARGET}"

RUN npm run build

# ---------- Stage 2: Production ----------
FROM nginx:1.27-alpine

RUN mkdir -p /etc/nginx/sites-available \
             /etc/nginx/sites-enabled

COPY nginx/nginx.conf /etc/nginx/sites-available/payroll.dimeapp.co.ke

RUN ln -sf /etc/nginx/sites-available/payroll.dimeapp.co.ke \
            /etc/nginx/sites-enabled/payroll.dimeapp.co.ke

RUN rm -f /etc/nginx/conf.d/default.conf

RUN sed -i '/include \/etc\/nginx\/conf\.d\/\*\.conf;/a\
    include /etc/nginx/sites-enabled/*;' \
    /etc/nginx/nginx.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]