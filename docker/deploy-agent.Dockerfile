# Minimal deploy agent: adnanh/webhook + Docker CLI + compose plugin.
# Receives signed webhooks from GitHub Actions and runs deploy.sh on the host's
# Docker engine (via the mounted /var/run/docker.sock).

FROM alpine:3.20

RUN apk add --no-cache \
      ca-certificates \
      bash \
      curl \
      git \
      tini \
      docker-cli \
      docker-cli-compose \
      webhook

WORKDIR /workspace

EXPOSE 9000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["webhook", "-hooks=/etc/webhook/hooks.yaml", "-verbose", "-hotreload", "-template", "-port=9000"]
