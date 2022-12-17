FROM node:18

WORKDIR /app


COPY package.json yarn.lock ./
RUN yarn install --immutable

COPY . .

COPY --from=wheatstalk/aws-lambda-adapter-pullthrough:0.3.3 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT=3000

CMD ["yarn", "start"]
