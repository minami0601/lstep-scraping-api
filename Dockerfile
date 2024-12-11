FROM node:10.15.3-jessie as build

ENV APP_ROOT /app

ENV NODE_ENV development

WORKDIR $APP_ROOT

COPY package*.json ./

RUN npm install

COPY . $APP_ROOT

RUN npm run build

FROM mcr.microsoft.com/playwright:latest
# FROM mcr.microsoft.com/playwright:bionic
# FROM mcr.microsoft.com/playwright:focal

# RUN npm install -g npm@8.3.0

ARG BUILD_ENV=

ENV APP_ROOT /app
ENV HOST 0.0.0.0
ENV PORT 5050

WORKDIR $APP_ROOT

RUN echo $NODE_ENV

# RUN npm install -g npm
RUN npm install -g npm@8.3.0

# 日本語対応
RUN apt-get update && apt-get -y install locales fonts-ipafont fonts-ipaexfont && echo "ja_JP UTF-8" >/etc/locale.gen && locale-gen

# COPY --from=build $APP_ROOT/package*.json $APP_ROOT/
# COPY --from=build $APP_ROOT/dist $APP_ROOT/dist/
# COPY --from=build $APP_ROOT/node_modules $APP_ROOT/node_modules/

COPY --from=build $APP_ROOT/package.json $APP_ROOT/
COPY --from=build $APP_ROOT/dist $APP_ROOT/dist/
# COPY --from=build $APP_ROOT/node_modules $APP_ROOT/node_modules/

# Sheets API 認証情報
COPY sheets/secrets/*.json $APP_ROOT/sheets/secrets/


RUN npm install --production

EXPOSE $PORT

CMD ["npm", "run", "start"]
