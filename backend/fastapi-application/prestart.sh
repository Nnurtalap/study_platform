#!/usr/bin/env bash 
set -e
ehco 'run migrations....'

alembic upgrade head 

exec '$@'