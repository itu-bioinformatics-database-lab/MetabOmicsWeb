FROM node:10.5 as build-stage

COPY . /app

WORKDIR /app

RUN npm install

RUN npm run build --prod --output-path=./dist
# RUN npm run build

FROM nginx:1.15

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build-stage app/dist/metabol /app

EXPOSE 80


###########################################
# FROM node:10.5 as build-stage

# COPY . /app

# WORKDIR /app

# RUN npm install

# #RUN npm run build --prod --output-path=./dist
# RUN npm run build

# FROM nginx:1.15

# COPY nginx.conf /etc/nginx/nginx.conf

# COPY --from=build-stage app/dist/metabol /app

# EXPOSE 80

#####################################################

## Stage 1: Build an Angular Docker Image
#FROM node:10.5 as build
#
#COPY . /app
#
#WORKDIR /app
#
#COPY package*.json /app/
#
#RUN npm install
#
#RUN npm run build --prod --outputPath=./dist/metabol
#
## Stage 2, use the compiled app, ready for production with Nginx
#FROM nginx:1.15
#
#COPY nginx.conf /etc/nginx/nginx.conf
#
#COPY --from=build app/dist/metabol /app
#
#EXPOSE 80

#FROM node:alpine AS builder
#
#WORKDIR /app
#
#COPY . .
#
#RUN npm install && \
#    npm run build
#
#FROM nginx:alpine
#
#COPY nginx.conf /etc/nginx/nginx.conf
#
#COPY --from=builder app/dist/metabol /app
#
#EXPOSE 80
