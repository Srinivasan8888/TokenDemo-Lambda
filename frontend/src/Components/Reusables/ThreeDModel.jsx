import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  useGLTF,
  OrbitControls,
  PresentationControls,
  Html,
} from "@react-three/drei";

const Model = ({ lastData, thresholdStatus, selectedSensors }) => {
  const group = useRef();
  const gltfPath = "./tundish (1).glb";
  const { scene } = useGLTF(gltfPath);

  const [sensorMeshes, setSensorMeshes] = useState([]);

  useEffect(() => {
    const meshes = [];
    scene.traverse((child) => {
      if (child.isMesh && selectedSensors.includes(child.name)) {
        meshes.push(child);
      }
      if (
        child.isMesh &&
        child.name.startsWith("s") &&
        child.name.length <= 3
      ) {
        const key = child?.name?.toUpperCase();
        if (thresholdStatus[key] === "high") {
          child.material.color.set("red");
        } else if (thresholdStatus[key] === "inRange") {
          child.material.color.set("#16A34A");
        } else if (thresholdStatus[key] === "low") {
          child.material.color.set("#3047C0");
        } else {
          child.material.color.set("#FFFFFF");
        }
      }
    });
    setSensorMeshes(meshes);
  }, [scene, selectedSensors, thresholdStatus]);

  const fgSensors = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"];

  return (
    <>
      <primitive ref={group} object={scene} position={[0, 0, 0]} />

      {sensorMeshes.map((mesh) => {
        const pos = mesh.position;
        const key = mesh?.name?.toUpperCase();
        const status = thresholdStatus[key];
        return (
          <Html
            key={mesh.name}
            position={[pos.x, pos.y, pos.z]}
            zIndexRange={[0, 0]}
          >
            <div
              className={`flex items-center -translate-x-1/2  ${
                fgSensors.includes(mesh.name)
                  ? "-translate-y-full flex-col"
                  : "flex-col-reverse"
              }`}
            >
              <div
                className={`${
                  status === "high"
                    ? "bg-red-500"
                    : status === "inRange"
                    ? "bg-green-500"
                    : status === "low"
                    ? "bg-[#3047C0]"
                    : "bg-gray-500"
                } text-white text-[10px] leading-tight p-1 rounded-sm shadow-lg flex flex-col items-center`}
              >
                <div className="text-[8px] leading-tight">
                  Sensor {mesh?.name?.substring(1)}:
                </div>
                <div className="font-medium">
                  {lastData
                    ? `${lastData[`S${mesh?.name?.substring(1)}`]} °C`
                    : "N/A"}
                </div>
              </div>
              <div className="h-10 2xl:h-16 w-0.5 bg-gray-700" />
            </div>
          </Html>
        );
      })}
    </>
  );
};

const ThreeDModel = ({ lastData, thresholdStatus }) => {
  const [selectedSensors, setSelectedSensors] = useState(() =>
    localStorage.getItem("3dConfig")
      ? localStorage.getItem("3dConfig").split(",")
      : ["s1", "s2", "s3"]
  );

  return (
    <div className="w-full flex">
      <div className="flex flex-1">
        <Canvas dpr={[1, 2]} shadows camera={{ position: [1, 5, 8], fov: 50 }}>
          <ambientLight intensity={2} />
          <directionalLight position={[5, 5, 5]} intensity={2} castShadow />
          <pointLight position={[0, 3, 5]} intensity={1} />
          <PresentationControls speed={1.5} global>
            <Model
              lastData={lastData}
              thresholdStatus={thresholdStatus}
              selectedSensors={selectedSensors}
            />
          </PresentationControls>
          <OrbitControls maxDistance={20} />
        </Canvas>
      </div>

      <div className="grid grid-cols-2 text-xs gap-0.5">
        {Array.from({ length: 14 }, (_, i) => `s${i + 1}`).map((sensor) => (
          <label
            key={sensor}
            className="flex items-center gap-1 cursor-pointer font-medium hover:font-bold duration-200"
          >
            <input
              type="checkbox"
              checked={selectedSensors.includes(sensor)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedSensors((prev) => {
                    const updated = [...prev, sensor];
                    localStorage.setItem("3dConfig", updated.join(","));
                    return updated;
                  });
                } else {
                  setSelectedSensors((prev) => {
                    const updated = prev.filter((s) => s !== sensor);
                    localStorage.setItem("3dConfig", updated.join(","));
                    return updated;
                  });
                }
              }}
            />
            <span>{sensor}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ThreeDModel;
