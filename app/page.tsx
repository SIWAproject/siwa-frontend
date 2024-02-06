"use client";
import LoginButton from "@/components/boton";
import { createContext, useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import Link from "next/link";

const BearerContext = createContext('');

export default function Home() {
  const [accessToken, setAccessToken] = useState('');
  const [projectIds, setProjectIds] = useState([]);
  const { user, error, isLoading } = useUser();
  const [empresa, setEmpresa] = useState();
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [tokenObtenido, setTokenObtenido] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      if (!user) {
        // Si no hay usuario autenticado, no hacer nada
        console.log("Usuario no autenticado");
        return;
      }
      try {
        const response = await fetch("http://localhost:3000/api/auth/token");
        const { accessToken } = await response.json();
        setAccessToken(accessToken);
        setTokenObtenido(true);
        console.log("Token obtenido:", accessToken);
        return accessToken; // Retorna el token obtenido para su uso posterior
      } catch (error) {
        console.error("Error al obtener token:", error);
      }
    };
    fetchToken();
    if (tokenObtenido) {
      const fetchProjectIds = async (token: any) => {
        // Usa el token pasado como argumento
        try {
          const response = await fetch("http://127.0.0.1:8000/projects", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error("Respuesta no válida al obtener projectIds");
          }
          const result = await response.json();
          console.log(result);
          const ids = result.projects;
          const empresa = result.empresa;
          setEmpresa(empresa);
          setProjectIds(ids);
          setProjectsLoading(false);
        } catch (error) {
          console.error("Error al obtener projectIds:", error);
        }
      };

      console.log(accessToken, tokenObtenido);
      // Llama a fetchToken y luego a fetchProjectIds con el token obtenido
      if (accessToken && tokenObtenido) {
        fetchProjectIds(accessToken);
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {/* Aquí puedes poner un componente de carga o un simple texto */}
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <BearerContext.Provider value={accessToken}>
        <div className="flex">
          <div
            id="default-sidebar"
            className="top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0"
            aria-label="Sidebar"
          >
            <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
              <div className="flex flex-col items-center mt-5 mb-10">
                <div className="">
                  <img
                    src={user?.picture ?? ""}
                    alt={""}
                    width={50}
                    height={50}
                    className="bg-gray-200 w-28 h-28 rounded-full"
                  ></img>
                </div>
                <div className="mt-4 text-center">
                  <h2 className="text-sm font-bold">{user.name}</h2>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                </div>
              </div>
              <ul className="space-y-2 font-medium">
                <li>
                  <a
                    href="#"
                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 22 21"
                    >
                      <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z" />
                      <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z" />
                    </svg>
                    <span className="ms-3">Dashboard</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/api/auth/logout"
                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                  >
                    <svg
                      className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.96 2.96 0 0 0 .13 5H5Z" />
                      <path d="M6.737 11.061a2.961 2.961 0 0 1 .81-1.515l6.117-6.116A4.839 4.839 0 0 1 16 2.141V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H0v11a1.969 1.969 0 0 0 1.933 2h12.134A1.97 1.97 0 0 0 16 18v-3.093l-1.546 1.546c-.413.413-.94.695-1.513.81l-3.4.679a2.947 2.947 0 0 1-1.85-.227 2.96 2.96 0 0 1-1.635-3.257l.681-3.397Z" />
                      <path d="M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4A.961.961 0 0 0 8.961 16Zm7.477-9.8a.958.958 0 0 1 .68-.281.961.961 0 0 1 .682 1.644l-.315.315-1.36-1.36.313-.318Zm-5.911 5.911 4.236-4.236 1.359 1.359-4.236 4.237-1.7.339.341-1.699Z" />
                    </svg>
                    <span className="flex-1 ms-3 whitespace-nowrap">
                      Sign Up
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center mt-28 content-center w-full">
            <div className="bg-gray-200 w-64 h-64 rounded-lg mx-4 text-center p-10 justify-center flex flex-col">
              <div className="mt-2 mb-2">
                <div>
                  {projectsLoading ? (
                    <div>Cargando...</div> // Muestra esto mientras 'isLoading' es true
                  ) : (
                    projectIds.length
                  )}
                </div>
                <div>Proyectos en curso</div>
              </div>
              <div className="mt-2 mb-2">
                <div>
                  {projectsLoading ? (
                    <div>Cargando...</div> // Muestra esto mientras 'isLoading' es true
                  ) : (
                    empresa
                  )}
                </div>
                <div>Empresa</div>
              </div>
            </div>
            <div className="bg-gray-200 w-64 h-64 rounded-lg mx-4 text-center p-10 justify-center flex flex-col">
              <div className="mt-2 mb-2">
                <ul>
                  {projectsLoading ? (
                    <li>Cargando...</li> // Muestra esto mientras 'isLoading' es true
                  ) : (
                    projectIds.map((projectId: any) => (
                      <li key={projectId}><Link href={`/projects/${projectId}`}>{projectId}</Link></li>
                    ))
                  )}
                </ul>
                <div>Proyectos</div>
              </div>
            </div>
          </div>
        </div>
        </BearerContext.Provider>
      ) : (
        <LoginButton></LoginButton>
      )}
    </>
  );
}
