import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import vertexShader from './planeShader/vertex.glsl';
import fragmentShader from './planeShader/fragment.glsl';

import curlvertexShader from './curlsShader/vertex.glsl';
import curlFragmentShader from './curlsShader/fragment.glsl';
import { computeCurl } from './Utility';


export default class Experience {
    /**
     * @param {Object} options 
     * @param {Element} options.dom 
     */
    constructor({ dom }) {
        this.scene = new THREE.Scene();
        this.scene1 = new THREE.Scene();

        this.container = dom;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x000000, 1.0);
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);
        this.renderer.autoClear = false;

        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 0, 2);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.time = new THREE.Clock();

        this.boundRender = this.render.bind(this);
        this.boundResize = this.resize.bind(this);

        this.raycaster = new THREE.Raycaster();
        this.eMouse = new THREE.Vector2();
        this.elasticMouseVel = new THREE.Vector2();
        this.elasticMouse = new THREE.Vector2();

        this.createCurls();
        this.createPlane();

        window.requestAnimationFrame(this.boundRender);
        window.addEventListener('resize', this.boundResize);
    }

    createPlane() {

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uLight: { value: new THREE.Vector3() }
            },
            side: THREE.DoubleSide,
            vertexShader,
            fragmentShader
        });

        this.rayCastPlane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(10, 10),
            this.material
        )
        this.scene1.add(this.rayCastPlane);

        this.light = new THREE.Mesh(
            new THREE.SphereBufferGeometry(0.02, 20, 20),
            new THREE.MeshBasicMaterial({ color: 0xa8e6cf })
        )

        this.scene.add(this.light);

        this.container.addEventListener('mousemove', (event) => {

            const x = (event.clientX / window.innerWidth) * 2 - 1;
            const y = - (event.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera({ x, y }, this.camera);
            this.eMouse.x = event.clientX;
            this.eMouse.y = event.clientY;

            const intersects = this.raycaster.intersectObjects([this.rayCastPlane]);
            if (intersects.length > 0) {
                let point = intersects[0].point;
                this.eMouse.x = point.x;
                this.eMouse.y = point.y;
            }
        })

    }

    resize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
    }

    createCurls() {

        this.materialTubes = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uLight: { value: new THREE.Vector3() }
            },
            side: THREE.DoubleSide,
            vertexShader: curlvertexShader,
            fragmentShader: curlFragmentShader
        });

        for (let i = 0; i < 100; i++) {

            let path = new THREE.CatmullRomCurve3(
                this.getCurlPoints(new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                )
                )
            );
            const geometry = new THREE.TubeBufferGeometry(path, 300, 0.005, 8, false);

            const tube = new THREE.Mesh(geometry, this.materialTubes);
            this.scene.add(tube);
        }

    }

    getCurlPoints(start) {

        let points = [];
        let scale = 0.1;

        points.push(start);
        let newPoint = start.clone();

        for (let i = 0; i < 300; i++) {

            let v = computeCurl(
                newPoint.x * scale,
                newPoint.y * scale,
                newPoint.z * scale
            )

            newPoint.addScaledVector(v, 0.001);
            points.push(newPoint.clone());

        }

        return points;

    }

    stop() {
        this.isPlaying = false;
    }

    play() {
        if (!this.isPlaying) {
            this.render();
            this.isPlaying = true;
        }
    }

    render() {

        const elapsedTime = this.time.getElapsedTime();

        const velocity = this.eMouse.clone().sub(this.elasticMouse).multiplyScalar(0.15);
        this.elasticMouseVel.add(velocity);
        this.elasticMouseVel.multiplyScalar(0.8);
        this.elasticMouse.add(this.elasticMouseVel);

        this.light.position.x = this.elasticMouse.x;
        this.light.position.y = this.elasticMouse.y;

        this.material.uniforms.uLight.value = this.light.position;
        this.materialTubes.uniforms.uLight.value = this.light.position;

        this.material.uniforms.uTime.value = elapsedTime;
        this.materialTubes.uniforms.uTime.value = elapsedTime;

        this.renderer.clear();
        this.renderer.render(this.scene1, this.camera);
        this.renderer.clearDepth();
        this.renderer.render(this.scene, this.camera);

        window.requestAnimationFrame(this.boundRender);
    }
}