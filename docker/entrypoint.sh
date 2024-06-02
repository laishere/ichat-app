#!/bin/sh

set -e

export SERVER_NAME=${SERVER_NAME:-localhost}
export BACKEND_HOST=${BACKEND_HOST:-backend}
export BACKEND_PORT=${BACKEND_PORT:-8080}

rm -f /etc/nginx/conf.d/*.conf

function subst {
    envsubst '$SERVER_NAME $BACKEND_HOST $BACKEND_PORT' < /etc/nginx/conf.d/$1.conf.template > /etc/nginx/conf.d/$1.conf
}

subst app

exec "$@"