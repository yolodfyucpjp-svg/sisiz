import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Points, PointMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

function ParticleField({ count = 3000 }) {
  const ref = useRef()
  const { mouse } = useThree()

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 2.5 + Math.random() * 0.5
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [count])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05
      ref.current.rotation.x += delta * 0.02
      // Mouse influence
      ref.current.rotation.x += (mouse.y * 0.1 - ref.current.rotation.x) * 0.01
      ref.current.rotation.z += (mouse.x * 0.1 - ref.current.rotation.z) * 0.01
    }
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#3fb06a"
        size={0.015}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  )
}

function GlobeWireframe() {
  const ref = useRef()
  const { mouse } = useThree()

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.08
      ref.current.rotation.x = mouse.y * 0.15
      ref.current.rotation.z = mouse.x * 0.1
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={ref}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial
          color="#0F5132"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
    </Float>
  )
}

function InnerGlow() {
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.03 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02
    }
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2.0, 32, 32]} />
      <meshBasicMaterial
        color="#3fb06a"
        transparent
        opacity={0.05}
      />
    </mesh>
  )
}

function OrbitRing({ radius, speed, tilt }) {
  const ref = useRef()

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.z += delta * speed
    }
  })

  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.003, 8, 100]} />
      <meshBasicMaterial color="#0F5132" transparent opacity={0.2} />
    </mesh>
  )
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.1} />
          <GlobeWireframe />
          <InnerGlow />
          <ParticleField count={2500} />
          <OrbitRing radius={3.0} speed={0.15} tilt={Math.PI / 6} />
          <OrbitRing radius={3.3} speed={-0.1} tilt={-Math.PI / 4} />
          <OrbitRing radius={3.6} speed={0.08} tilt={Math.PI / 3} />
        </Suspense>
      </Canvas>
    </div>
  )
}
