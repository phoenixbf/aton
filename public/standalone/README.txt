This is a very basic example of standalone ATON app without Node.js

You just need to place the current "standalone" folder into your webserver root, alongside current folders from upper-level "public", ending up with this structure:

<ROOTFOLDER>
--- standalone/
--- dist/
--- vendors/
--- res/

You can place assets (3D models, panoramas, scenes, etc.) into "standalone/assets/" folder (or change path accordingly into main.js)

You can rename "standalone" folder with a custom app-name, exposed as:
<your-domain>/<app-name>/