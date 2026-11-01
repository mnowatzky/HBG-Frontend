FROM httpd:2.4-alpine

# Apache does not use the curl that comes with the image, it only adds CVEs.
RUN apk upgrade --no-cache && apk del --no-cache curl

COPY deploy/apache.conf conf/extra/hbg.conf
RUN echo "Include conf/extra/hbg.conf" >> conf/httpd.conf

# Listed one by one so that local files like credentials.txt stay out of the image.
COPY index.html karte.html sticker.html stats.html bar_chart.html robots.txt sitemap.xml htdocs/
COPY css htdocs/css
COPY js htdocs/js
COPY bilder htdocs/bilder
RUN chmod -R a+rX htdocs

EXPOSE 80
