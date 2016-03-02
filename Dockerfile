FROM node:5.7.0

COPY . /app

ADD http://api.eia.gov/bulk/INTL.zip /app/INTL.zip

WORKDIR /app

RUN apt-get update && apt-get install p7zip-full

RUN 7z x INTL.zip

RUN npm install

CMD npm start