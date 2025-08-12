#!/bin/sh


# Variables par défaut
all=true
lib=false
demo=false

# Parcourir les arguments
while [ "$#" -gt 0 ]; do
    case "$1" in
        --lib)
            all=false
            lib=true
            ;;
        --demo)
            all=false
            demo=true
            ;;
        *)
            echo "Unknown argument : $1"
            ;;
    esac
    shift
done

# Si all est true, activer lib et demo
if [ "$all" = true ]; then
    lib=true
    demo=true
fi

# Exemple de traitement basé sur les options
if $lib ; then
    echo "Building library"
    # Build h5dmd lib image
    docker build -t h5dmd-lib:latest -f Dockerfile .
fi

if $demo; then
    echo "Building demo"
    # Build Demo image
    (cd Demo && ./build-docker-image.sh)
fi
