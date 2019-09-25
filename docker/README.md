# Running JBrowse with GDC Plugin in Docker
This will get JBrowse with the GDC Viewer Plugin running with Express on port 3000.

Based on [enuggetry/docker-jbrowse](https://github.com/enuggetry/docker-jbrowse)

## Build and Run from Dockerfile
### Setup data
*Important*: Place your track data in `./data`. This maps to `/jbrowse/data` in the container, which is where JBrowse stores reference data and track information.

### Build the docker image
`docker build . -t jbrowse-with-gdc`

### Run the docker image
`docker run -p 3000:3000 -v {pwd}/data:/jbrowse/data jbrowse-with-gdc utils/jb_run.js -p 3000`

Note: You can run in the background using the detach mode (-d)

`docker run -d -p 3000:3000 -v {pwd}/data:/jbrowse/data jbrowse-with-gdc utils/jb_run.js -p 3000`

## Build and Run from Docker Compose
You can also use Docker Compose to build the image. Ensure you are working in the same directory as the `docker-compose.yml`.

### Build docker-compose
`docker-compose build`

### Run the docker-compose
`docker-compose up`

Note: You can run in the background using the detach mode (-d)

`docker-compose up -d`

## Load refseq and tracks
If you already have your `tracks.conf` and `seq/`, etc., you can simply put these files into your `./data` directory.

You will have to put the RefSeq data into the `./data` directory. Download the GRCh38 `.fa` and `.fa.fai` files online (ex. http://bioinfo.hpc.cam.ac.uk/downloads/datasets/fasta/grch38/). Then put the following in `./data/tracks.conf` (note files may be named something else).

```
refSeqs=GRCh38.genome.fa.fai
  
[tracks.refseqs]
urlTemplate=GRCh38.genome.fa
```

Now go to `localhost:3000` and you should see JBrowse with your refdata and tracks!

### Enter the Docker Container
You can enter the container by doing the following:

```
# Get container ID
docker ps

# Enter container
docker exec -it <container-id> /bin/bash
```