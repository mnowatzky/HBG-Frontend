FROM httpd:2.4-alpine

# Apache does not use the curl that comes with the image, it only adds CVEs.
RUN apk upgrade --no-cache && apk del --no-cache curl

COPY deploy/apache.conf conf/extra/hbg.conf
RUN echo "Include conf/extra/hbg.conf" >> conf/httpd.conf

# Apache's "It works!" page; / redirects to /karte.
RUN rm htdocs/index.html

# Listed one by one so that local files like credentials.txt stay out of the image.
COPY karte.html sticker.html stats.html datenschutz.html robots.txt htdocs/
COPY css htdocs/css
COPY js htdocs/js
COPY bilder htdocs/bilder
RUN chmod -R a+rX htdocs

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
    CMD wget -q -O /dev/null http://127.0.0.1/karte
