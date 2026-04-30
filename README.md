# ATON 3.0 framework

[Official ATON website](https://osiris.itabc.cnr.it/aton/) | 
[Telegram open-group](https://t.me/ATON_Framework) | 
[Live examples](https://aton.ispc.cnr.it/examples/) | 
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/phoenixbf/aton)

![Header](./public/res/aton-header.jpg)

[ATON framework](http://osiris.itabc.cnr.it/aton/) - designed, developed and coordinated by B. Fanini (CNR ISPC, ex ITABC) - allows to create scalable, collaborative and *cross-device* 3D Web-Apps (mobile, desktop and immersive VR) targeting Cultural Heritage exploiting modern web standards, without any installation required for final users. ATON offers:
* Responsive, adaptive and scalable presentation of interactive 3D content (mobile, desktop PCs, museum kiosks, XR devices)
* Real-time collaborative multi-user features (*Photon* component)
* Immersive VR (WebXR) for 3-DOF and 6-DOF devices
* Multi-resolution for massive 3D datasets through Cesium 3D Tiles v1.0 and v1.1 (OGC standard)
* Support for 3D Gaussian Splats formats
* Multi-touch interfaces
* Spatial UI (3D labels, buttons, etc...) targeting immersive XR sessions
* Built-in navigation modes, including *orbit*, *first-person*, *device-orientation* and *immersive VR*
* 3D semantic annotations including free-form volumetric shapes
* Built-in front-end ("Hathor") to present and edit/publish 3D scenes with advanced features
* Fast, real-time 3D queries on standard and semantic scene-graphs and UI nodes
* Built-in profiler (automatically adapt 3D presentation to different devices)
* Built-in services to access 3D collections and scenes for multiple users via authentication
* Built-in export of 3D scenes/models using different formats (gltf/glb, obj, usd,...) right from the browser
* Event-driven API for fully customizable events (local and synchronous collaborative contexts)
* 360 panoramas and virtual tours
* Physically-Based Rendering (PBR) for advanced materials and custom shaders for complex representations, including latest extensions
* Advanced lighting, including IBL and multiple Light Probes
* Camera/POV transitions, viewpoint handling and custom navigation constraints
* Scene-graph manipulation, layers, hierarchical culling, instancing, composition and cascading transformations
* Scalable deployment, from low-cost SBCs (e.g. Raspberry Pi) to large infrastructures
* Easily extensible through *plug&play* apps architecture and plugins

The framework provides a *built-in* front-end ("Hathor") and services based on [Node.js](https://nodejs.org/) for deployment on servers, infrastructures or single-board computers; real-time collaborative multi-user features and support for remote/immersive visual analytics.

## Getting started (quick)
1) Install [Node.js](https://nodejs.org/) for your operating system.

2) Install (or update) required modules from main ATON folder by typing:
```
npm install
```

3) Deploy ATON *main service* on local machine simply using:
```
npm start
```

4) Open http://localhost:8080 on your browser.

# Citation
You can cite ATON framework using [this open-access publication](https://www.mdpi.com/2076-3417/11/22/11062) with the following BibTeX entry:
```
@article{fanini2021aton,
  title={ATON: An Open-Source Framework for Creating Immersive, Collaborative and Liquid Web-Apps for Cultural Heritage},
  author={Fanini, Bruno and Ferdani, Daniele and Demetrescu, Emanuel and Berto, Simone and d’Annibale, Enzo},
  journal={Applied Sciences},
  volume={11},
  number={22},
  pages={11062},
  year={2021},
  publisher={Multidisciplinary Digital Publishing Institute}
}
```

or - as software - using the Zenodo DOI [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.4618387.svg)](https://doi.org/10.5281/zenodo.4618387) with the following BibTeX entry:
```
@software{aton2020_4618387,
  author       = {Bruno Fanini},
  title        = {ATON framework},
  year         = 2020,
  publisher    = {Zenodo},
  version      = {3.0},
  doi          = {10.5281/zenodo.4618387},
  url          = {https://doi.org/10.5281/zenodo.4618387}
}
```

# Publications
Main bibliographical reference (open access) of the framework is:

*Fanini, B., Ferdani, D., Demetrescu, E., Berto, S., & d’Annibale, E. (2021). [ATON: An Open-Source Framework for Creating Immersive, Collaborative and Liquid Web-Apps for Cultural Heritage](https://www.mdpi.com/2076-3417/11/22/11062). Applied Sciences, 11(22), 11062.*

You can find [here](https://osiris.itabc.cnr.it/aton/index.php/publications/) a complete list of publications where ATON was employed in different national and international projects.

# Contribute
You are more than welcome to contribute to the project by spotting bugs/issues and providing code or solutions through pull requests to fix or improve ATON functionalities (see TODO list below). Get in touch here on github, through the [telegram open-group](https://t.me/ATON_Framework) or through the other channels.

# TODO list

- [ ] Rewrite developers examples with ATON.UI.* elements