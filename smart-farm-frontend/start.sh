#!/bin/sh
# Replace $PORT with actual port value
envsubst '$PORT' < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf

# Start nginx
nginx -g "daemon off;"