#!/bin/bash
# Quick database count checker

if [ -z "$DATABASE_URL" ]; then
    if [ -f "./env.local" ]; then
        echo "Loading DATABASE_URL from env.local..."
        export DATABASE_URL=$(grep -E '^DATABASE_URL=' ./env.local | head -n 1 | cut -d '=' -f2-)
    elif [ -f "./.env.local" ]; then
        echo "Loading DATABASE_URL from .env.local..."
        export DATABASE_URL=$(grep -E '^DATABASE_URL=' ./.env.local | head -n 1 | cut -d '=' -f2-)
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found"
    exit 1
fi

echo "🔍 Checking database counts..."
psql "$DATABASE_URL" -f scripts/check-db-count.sql
