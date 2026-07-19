# My Cloud Explorer Badge

A personal badge webapp with a built-in photo booth - click the card to
flip it over, take 3 photos with your front camera, and save a vintage
photo strip. Everything stays on your own device - no photo or camera
data is ever sent anywhere.

Make it yours by editing the `CONFIG` object in `src/config.ts` (your name,
fun fact, favorite movie/game, colors).

## 1. Run it locally

You'll need [Node.js](https://nodejs.org/) installed (v20+):
[Windows installer](https://nodejs.org/dist/v24.18.0/node-v24.18.0-x64.msi) |
[macOS installer](https://nodejs.org/dist/v24.18.0/node-v24.18.0.pkg)

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). The photo
booth works here because `localhost` counts as secure - no HTTPS setup
needed for local testing.

## 2. Deploy to the cloud (Alibaba Cloud VM)

The camera feature requires HTTPS once you're not on `localhost`
anymore - browsers block camera access on plain `http://`. This repo
already includes a `Dockerfile` and `Caddyfile` that get you a real,
trusted HTTPS certificate for free, with no domain purchase needed.

The image is built and pushed to **Docker Hub** (not built on the VM) -
this keeps a single built artifact that both the VM and, later, a
Kubernetes cluster can pull.

**On your own machine (with Docker Desktop):**

1. Sign in to Docker Hub in Docker Desktop (top-right → Sign in). The
   `docker` CLI it ships reuses that login - no `docker login` needed.
2. Build and push:
   ```bash
   docker build --platform linux/amd64 -t <your-dockerhub-username>/cloud-explorer .
   docker push <your-dockerhub-username>/cloud-explorer
   ```

**On your VM:**

1. Install Docker if it isn't already there.
2. Open ports `80` and `443` in your VM's security group (Alibaba
   Cloud console → your instance → Security Groups). Both are needed -
   port 80 is used briefly to prove you own the domain, port 443 serves
   the site.
3. Run it, using your VM's public IP with dots replaced by dashes,
   suffixed with `.sslip.io` (this is a free service that maps that
   hostname straight to your IP - no DNS setup required). `--pull always`
   makes Docker fetch the image from Docker Hub before starting it:
   ```bash
   docker run -d --pull always -p 80:80 -p 443:443 \
     -e SITE_ADDRESS=<your-ip-with-dashes>.sslip.io \
     --name cloud-explorer <your-dockerhub-username>/cloud-explorer
   ```
   Example: if your VM's IP is `47.253.1.100`, use
   `SITE_ADDRESS=47-253-1-100.sslip.io`.
4. Visit `https://<your-ip-with-dashes>.sslip.io` in your browser.
   You should see a trusted padlock - the photo booth will work.

Caddy (the web server inside the container) automatically issues and
renews the HTTPS certificate for you - there's nothing else to
configure.

### Updating after a code change

```bash
# on your machine
docker build --platform linux/amd64 -t <your-dockerhub-username>/cloud-explorer .
docker push <your-dockerhub-username>/cloud-explorer

# on the VM
docker rm -f cloud-explorer 2>/dev/null
docker run -d --pull always -p 80:80 -p 443:443 \
  -e SITE_ADDRESS=<your-ip-with-dashes>.sslip.io \
  --name cloud-explorer <your-dockerhub-username>/cloud-explorer
```

`--pull always` makes `docker run` fetch the latest image itself, so there's no separate `docker pull` step; `docker rm -f` stops and removes the old container in one command instead of two.

Or just push to `main` on GitHub - the included Actions workflow
(`.github/workflows/deploy.yml`) does all of the above for you.

### Troubleshooting

- **Camera doesn't prompt for permission**: check you're on `https://`,
  not `http://`. Look for the padlock icon.
- **Certificate fails to issue**: make sure ports 80 and 443 are open
  in the security group, and that you're using the `.sslip.io` hostname
  (not just the bare IP) in `SITE_ADDRESS`.
- **Container won't start**: check logs with `docker logs cloud-explorer`.
