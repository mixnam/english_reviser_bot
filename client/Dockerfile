FROM node:20-alpine

WORKDIR /app

# Copy the built server output
# The build must be run outside of Docker before building this image
COPY .output ./.output

ENV PORT=3000
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
