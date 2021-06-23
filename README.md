# ATON 3.0 framework

![Header](./public/res/aton-header.jpg)

ATON 3.0 framework - developed by B. Fanini (CNR ISPC, ex ITABC) - allows to create scalable, collaborative and *cross-device* 3D Web-Apps (mobile, desktop and immersive VR) targeting Cultural Heritage exploiting modern web standards, without any installation required for final users. ATON offers:
* Responsive, adaptive and scalable presentation of interactive 3D content (mobile, desktop PCs, museum kiosks, immersive VR devices)
* Real-time collaborative multi-user features (*VRoadcast* module)
* Immersive VR (WebXR) for 3-DOF and 6-DOF devices
* Multi-touch interfaces
* Spatial UI (3D labels, buttons, etc...) targeting immersive XR sessions
* Built-in navigation modes, including *orbit*, *first-person*, *device-orientation* and *immersive VR*
* 3D semantic annotations including free-form volumetric shapes
* Fast, real-time 3D queries on visible graph, semantic graph and UI nodes
* Built-in Front-End ("Hathor") with WYSIWYG rich HTML5 annotation editor
* Built-in profiler (adapt presentation to different devices)
* Built-in service to access 3D collections and scenes
* Event-driven API for fully customizable events (local and synchronous collaborative contexts)
* 360 panoramas and virtual tours
* Physically-Based Rendering (PBR) for advanced materials and custom shaders for complex representations
* Advanced lighting, including IBL and Light Probes
* Camera/POV transitions, viewpoint handling and custom navigation constraints
* Complex scene-graph manipulation, hierarchical culling, instancing, composition and cascading transformations
* Scalable deployment, from low-cost SBCs (e.g. Raspberry Pi) to large infrastructures
* Multi-temporal (4D) visualization
* Dynamic and customizable recommendation systems

The framework also provides a *built-in* front-end and services based on [Node.js](https://nodejs.org/) for deployment on servers, infrastructures or single-board computers; real-time collaborative features through the *VRoadcast* component and support for remote/immersive visual analytics.

## Getting started (quick)
1) Install [Node.js](https://nodejs.org/) for your operating system.

2) Install or update ATON services (from root folder) by typing:
```
npm update
```

3) Deploy ATON *main service* on local machine simply using:
```
npm start
```

4) Open http://localhost:8080/examples/basic/ on your browser.

# Citation
You can cite ATON framework using the Zenodo DOI [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.4618387.svg)](https://doi.org/10.5281/zenodo.4618387), and the following BibTeX entry:
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
Here is a list of publications where ATON (including previous versions) was employed:

* Fanini, B., Ferdani, D., & Demetrescu, E. (2021). Temporal Lensing: An Interactive and Scalable Technique for Web3D/WebXR Applications in Cultural Heritage. Heritage, 4(2), 710-724.
* Luigini, A., Fanini, B., Basso, A., & Basso, D. (2020). Heritage education through serious games. A web-based proposal for primary schools to cope with distance learning. VITRUVIO-International Journal of Architectural Technology and Sustainability, 5(2), 73-85.
* B. Fanini, L. Cinque (2020). Encoding, Exchange and Manipulation of Captured Immersive VR Sessions for Learning Environments: the PRISMIN Framework. Applied Sciences 2020, 10, 2026. Special Issue "Emerging Artificial Intelligence (AI) Technologies for Learning"
* B. Fanini (2020). Applications of a compact session encoding for immersive WebVR/XR analytics. Chapter 6 in Digital & Documentation – Digital strategies for Cultural Heritage. Vol. 2
* M. Lo Turco, P. Piumatti, M. Calvano, E. C. Giovannini, N. Mafrici, A. Tomalini, B. Fanini (2020). Interactive Digital Environments for Cultural Heritage and Museums. Building a digital ecosystem to display hidden collections. DISEGNARECON – ISSN 1828 5961
* Fanini, B., & Cinque, L. (2019). Encoding immersive sessions for online, interactive VR analytics. Virtual Reality, 1-16.
* Fanini, B., Pescarin, S., & Palombini, A. (2019). A cloud-based architecture for processing and dissemination of 3D landscapes online. Digital Applications in Archaeology and Cultural Heritage, e00100.
* Fanini, B., & Cinque, L. (2019, July). An Image-Based Encoding to Record and Track Immersive VR Sessions. In International Conference on Computational Science and Its Applications (pp. 299-310). Springer, Cham.
* Barsanti, S. G., Malatesta, S. G., Lella, F., Fanini, B., Sala, F., Dodero, E., & Petacco, L. (2018). The Winckelmann300 Project: Dissemination of Culture with Virtual Reality at the Capitoline Museum in Rome. International Archives of the Photogrammetry, Remote Sensing & Spatial Information Sciences, 42(2).
* Palombini, A., Fanini, B., Pagano, A. (2018, July). The Virtual Museum of the Upper Calore Valley. In International and Interdisciplinary Conference on Digital Environments for Education, Arts and Heritage (pp. 726-736). Springer, Cham.
* Fanini, B., & Cinque, L. (2018, October). Encoding VR sessions: image-based techniques to record and inspect immersive experiences. In 2018 3rd Digital Heritage International Congress (Digital Heritage) held jointly with 2018 24th International Conference on Virtual Systems & Multimedia (VSMM 2018) (pp. 1-8). IEEE.
* Meghini, C., Scopigno, R., Richards, J., Fanini, B., Wright, H., Geser, G., Cuy, S. et al. (2017). ARIADNE: a research infrastructure for archaeology. Journal on Computing and Cultural Heritage (JOCCH), 10(3), 18.
* Hollander, H. S., Aloia, N., Binding, C., Cuy, S., Doerr, M., Fanini, B., Meghini, C. et al. (2017). Enabling European Archaeological Research: The ARIADNE E-Infrastructure. Internet Archaeology, 17(43).
* Antal, A. and Bota, E. and Demetrescu, E. and Ciongradi, C. and and Fanini, B. and d'Annibale, E. and Dima, C. and Ferdani D. (2016). A complete workflow from the data collection on the field to the deployment of a Virtual Museum: the case of Virtual Sarmizegetusa.
