# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

COPY . .

ARG VITE_API_BASE=/api/v1
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:1.27-alpine

# Recreate Debian-style sites-available/sites-enabled layout
RUN mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

COPY nginx/nginx.conf /etc/nginx/sites-available/payroll.dimeapp.co.ke
RUN ln -s /etc/nginx/sites-available/payroll.dimeapp.co.ke \
          /etc/nginx/sites-enabled/payroll.dimeapp.co.ke

# Remove the default server block so it doesn't compete on the same port
RUN rm -f /etc/nginx/conf.d/default.conf

# Alpine's stock nginx.conf doesn't include sites-enabled/* — add it ourselves
RUN sed -i '/include \/etc\/nginx\/conf\.d\/\*\.conf;/a\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]