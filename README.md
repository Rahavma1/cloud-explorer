# My Cloud Explorer Badge

A personal badge webapp with a built-in photo booth - click the card to
flip it over, take 3 photos with your front camera, and save a vintage
photo strip. Everything stays on your own device - no photo or camera
data is ever sent anywhere.

Make it yours by editing the `CONFIG` object at the top of `src/App.tsx`
(your name, fun fact, favorite movie/game, colors).

## 1. Run it locally

You'll need [Node.js](https://nodejs.org/) installed (v20+).

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

**On your VM:**

1. Install Docker if it isn't already there.
2. Open ports `80` and `443` in your VM's security group (Alibaba
   Cloud console → your instance → Security Groups). Both are needed -
   port 80 is used briefly to prove you own the domain, port 443 serves
   the site.
3. Copy this project to the VM (`git clone`, `scp`, etc.) and build the
   image:
   ```bash
   docker build -t cloud-explorer .
   ```
4. Run it, using your VM's public IP with dots replaced by dashes,
   suffixed with `.sslip.io` (this is a free service that maps that
   hostname straight to your IP - no DNS setup required):
   ```bash
   docker run -d -p 80:80 -p 443:443 \
     -e SITE_ADDRESS=<your-ip-with-dashes>.sslip.io \
     --name cloud-explorer cloud-explorer
   ```
   Example: if your VM's IP is `47.253.1.100`, use
   `SITE_ADDRESS=47-253-1-100.sslip.io`.
5. Visit `https://<your-ip-with-dashes>.sslip.io` in your browser.
   You should see a trusted padlock - the photo booth will work.

Caddy (the web server inside the container) automatically issues and
renews the HTTPS certificate for you - there's nothing else to
configure.

### Updating after a code change

```bash
docker stop cloud-explorer && docker rm cloud-explorer
docker build -t cloud-explorer .
docker run -d -p 80:80 -p 443:443 \
  -e SITE_ADDRESS=<your-ip-with-dashes>.sslip.io \
  --name cloud-explorer cloud-explorer
```

### Troubleshooting

- **Camera doesn't prompt for permission**: check you're on `https://`,
  not `http://`. Look for the padlock icon.
- **Certificate fails to issue**: make sure ports 80 and 443 are open
  in the security group, and that you're using the `.sslip.io` hostname
  (not just the bare IP) in `SITE_ADDRESS`.
- **Container won't start**: check logs with `docker logs cloud-explorer`.
