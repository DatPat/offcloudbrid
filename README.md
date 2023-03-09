offcloudbrid
===

An offcloud.com blackhole downloader.

### Environment Variables

Value | Description | Default
--- | --- | ---
OFFCLOUD_API_KEY | Offcloud API Key |
DOWNLOAD_DIR | Directory to put downloaded files in |
WATCH_DIR | Directory to watch | /watch
WATCH_RATE | Rate to check for updates | 5000

### Development
forked from https://github.com/mgoodings/patbrid by Miles Goodings

#### Requirements

* An API-Key from offcloud.com
* Docker

#### Setup

Copy `.env.example` to `.env`

#### Run

`$ docker-compose build`

`$ docker-compose run --rm downloader`
