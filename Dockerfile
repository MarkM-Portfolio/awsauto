FROM node:10-alpine
ARG TIMESTAMP
LABEL version=${TIMESTAMP}
COPY --chown=node:node . /home/node/app
WORKDIR /home/node/app
RUN npm install
EXPOSE 3000
VOLUME ["/config"]
ENTRYPOINT [ "/home/node/app/entrypoint.sh" ]
CMD [ "node", "bin/www" ]
