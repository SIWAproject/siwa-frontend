"use client";
import { JSXElementConstructor, Key, PromiseLikeOfReactNode, ReactElement, ReactNode, useEffect, useRef, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import Layout from "@/app/components/Layout";
import Loading from "@/app/components/loading";
import Plot from "react-plotly.js";
import SkeletonCard from "@/app/components/skeletoncard";
import GraphicCard from "@/app/components/graphicCard";
import { Bounce, toast } from "react-toastify";
import { renderToStaticMarkup } from "react-dom/server";

// app/projects/[projectId].js
export async function generateStaticParams() {
    // Hardcoded project IDs with corresponding slugs
    const projects = [
      { id: 'E335', slug: 'E335' },
      { id: 'E346', slug: 'E346' },
    ];
  
    // Return an array of objects for each project
    return projects.map(project => ({ projectId: project.id }));
  }


export default function Page({ params }: { params: any }) {
    const { projectId } = params;
  

    const { user, error, isLoading } = useUser();
    const [accessToken, setAccessToken] = useState();
    const [isLoaded, setIsLoaded] = useState(false);
    const [plotData, setPlotData] = useState<
        { type: string; y: any; name: string }[]
    >([]);
    const [plotDataObserved, setPlotDataObserved] = useState<
        { type: string; y: any; name: string }[]
    >([]);
    const [otus, setOtus] = useState<any>();
    const [scatterData, setScatterData] = useState([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>(['cecum', 'feces', 'ileum']);
    const [availableLocations, setAvailableLocations] = useState<string[]>([]);
    const [selectedColumn, setSelectedColumn] = useState("");
    const [shannonData, setShannonData] = useState([]);
    const [observedData, setObservedData] = useState({});
    const [currentLocation, setCurrentLocation] = useState('');
    const [colorByOptions, setColorByOptions] = useState([]);
    const [colorBy, setColorBy] = useState<string>('none');
    const [isFilterCardVisible, setIsFilterCardVisible] = useState(false);
    const [isColorByDisabled, setIsColorByDisabled] = useState(true);
    const [scatterColors, setScatterColors] = useState<{ [key: string]: string }>({});
    const newScatterColors: { [key: string]: string } = {}; // Define el tipo explícitamente
    const [configFile, setconfigFile] = useState({} as any);
    const [plotWidth, setPlotWidth] = useState(0); // Inicializa el ancho como null
    const plotContainerRef = useRef(null); // Ref para el contenedor del gráfico
    const [loaded, setLoaded] = useState(false);
    let colorIndex = 0;
    
    const colors = [
      '#1f77b4', // azul metálico
      '#ff7f0e', // naranja de seguridad
      '#2ca02c', // verde cocodrilo
      '#d62728', // rojo ladrillo
      '#9467bd', // morado opaco
      '#8c564b', // marrón cuero
      '#e377c2', // rosa rasberry
      '#7f7f7f', // gris medio
      '#bcbd22', // verde siena
      '#17becf', // cian claro
      '#393b79', // azul medianoche
      '#637939', // verde oliva
      '#8c6d31', // marrón bambú
      '#843c39', // rojo oscuro
      '#7b4173', // morado orquídea
      '#bd9e39', // dorado tierra
      '#e7cb94', // amarillo vainilla
      '#e7ba52', // amarillo dorado
      '#cedb9c', // verde manzana
      '#e7969c', // rosa salmón
      '#a55194', // morado berenjena
      '#b5cf6b', // lima brillante
      '#9c9ede', // lavanda suave
      '#cedb9c', // verde pastel
      '#f7b6d2', // rosa pastel
      '#ad494a', // rojo carmín
      '#8ca252', // verde musgo
      '#000000', // negro
      '#5254a3', // azul índigo
      '#ff9896', // rosa claro
      '#98df8a', // verde menta
      '#ffbb78', // naranja melocotón
      '#aec7e8', // azul cielo
      '#c5b0d5', // lila
      '#c49c94', // marrón arena
      '#f7b6d2', // rosa claro
      '#c7c7c7', // gris claro
      '#dbdb8d', // amarillo pastel
      '#9edae5'  // turquesa claro
    ];
    const fetchToken = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/auth/token");
            const { accessToken } = await response.json();
            setAccessToken(accessToken);
            console.log("Token obtenido:", accessToken);
            return accessToken; // Retorna el token obtenido para su uso posterior
        } catch (error) {
            console.error("Error al obtener token:", error);
        }
    };
    const toggleFilterCardVisibility = () => {
        setIsFilterCardVisible(!isFilterCardVisible);
    };

    useEffect(() => {
        // Función para actualizar el ancho del gráfico con un pequeño retraso
        const updatePlotWidth = () => {
          setTimeout(() => {
            if (plotContainerRef.current) {
              setPlotWidth((plotContainerRef.current as HTMLElement).offsetWidth);
              setLoaded(true)
            }
          }, 800); // Retraso de 10 ms
        };
    
        updatePlotWidth(); // Establece el ancho inicial
    
        window.addEventListener('resize', updatePlotWidth); // Añade un listener para actualizar el ancho en el redimensionamiento
    
        return () => {
          window.removeEventListener('resize', updatePlotWidth);
        };
      }, [projectId, plotData]);


    const fetchConfigFile = async (token: any) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/projects/config/${projectId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const configfile = await response.json(); // Asume que las opciones vienen en un campo llamado 'configfile'
            setconfigFile(configfile.configFile);
            setColorByOptions(configfile.configFile.columns); // Actualiza el estado con las nuevas opciones
        } catch (error) {
            console.error("Error al cargar las opciones del dropdown:", error);
        }
    };

    const fetchData = async (token: any, columnIndex: number | undefined) => {

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/projects/alpha-diversity/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ "samplelocation": selectedLocations })
            }
            );
            if (response.status === 404) {
                toast.warn('The data needs to be loaded again!', {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                    transition: Bounce,
                });
                setTimeout(() => { window.location.href = "/"; }, 5000);
                throw new Error("Respuesta no válida desde el servidor");
            }
            const result = await response.json();
            console.log(result);
            const locations = new Set(
                result.data.data.map((item: any[]) => item[1])
            );
            const uniqueLocations = Array.from(locations) as string[];
            setAvailableLocations(uniqueLocations);

            setOtus(result);

            setIsLoaded(true);
            return result;
        } catch (error) {
            console.error("Error al obtener projectIds:", error);
        }
    };



    const fetchProjectIds = async (result: any, columnIndex: number | undefined) => {
        
        // Usa el token pasado como argumento
        try {
            const isAllLocationsSelected = selectedLocations.length === 3 && ["cecum", "feces", "ileum"].every(location => selectedLocations.includes(location));

            // Filtrar los datos basados en la locación seleccionada, si se ha seleccionado una
            const filteredData = result?.data?.data?.filter((item: string[]) => selectedLocations.includes(item[1])) || [];

            const groupedData = filteredData.reduce(
                (
                    acc: {
                        [x: string]: {
                            y: any;
                            text: string[];
                            marker: { color: string};

                        };
                    },
                    item: any[]
                ) => {
                    const location = item[1];
                    const alphaShannon = item[9];
                    const sampleId = item[0];
                    // Verifica si la locación actual debe ser incluida
                    if (selectedLocations.includes(location)) {
                        if (!acc[location]) {
                            acc[location] = { y: [], text: [], marker: { color: colors[colorIndex % colors.length] }
                        };
                        console.log(location)
                          newScatterColors[location] = colors[colorIndex % colors.length]; // Actualiza la copia con el nuevo color
                          colorIndex++; 
                        }
                        acc[location].y.push(alphaShannon);
                        acc[location].text.push(`Sample ID: ${sampleId}`);
                    }

                    return acc;
                },
                {}
            );
            setScatterColors(newScatterColors);

            const groupedDataObserved = filteredData.reduce(
                (
                    acc: {
                        [x: string]: {
                            y: any;
                            text: string[];
                        };
                    },
                    item: any[]
                ) => {
                    const location = item[1];
                    const alphaObserved = item[10];
                    const sampleId = item[0];
                    // Verifica si la locación actual debe ser incluida
                    if (selectedLocations.includes(location)) {
                        if (!acc[location]) {
                            acc[location] = { y: [], text: [] };
                        }
                        acc[location].y.push(alphaObserved);
                        acc[location].text.push(`Sample ID: ${sampleId}`);
                    }

                    return acc;
                },
                {}
            );

            const shannonData: any[] = processData(filteredData.filter((data: { name: null; }) => data.name !== "null"), columnIndex || 1);
            const observedData = processData(filteredData, (columnIndex || 1) + 1);
            setShannonData(shannonData as never[]);
            setObservedData(observedData);

            setPlotData(
                Object.keys(groupedData).map((location) => ({
                    ...groupedData[location],
                    type: "box",
                    name: location,
                }))
            );


            setPlotDataObserved(
                Object.keys(groupedDataObserved).map((location) => ({
                    ...groupedDataObserved[location],
                    type: "box",
                    name: location,
                }))
            );

            setIsLoaded(true);
        } catch (error) {
            console.error("Error al obtener projectIds:", error);
        }
    };



    const processData = (data: any[], index: number): any[] => {

        if (!Array.isArray(data)) {
            console.error('Expected an array for data, received:', data);
            return [];
        }
        data = data.filter(item => item[index] !== null) 
        const result = data.reduce((acc, item) => {
            const location = item[1];
            const value = item[index];
            if (value !== null) {
            const key = `${location}-${value}`;
    
            if (!acc[key]) {
                acc[key] = { y: [], text: [], name: `${value === undefined ? location : value}`, marker: {color: colors[colorIndex % colors.length] }
            };
              newScatterColors[value] = colors[colorIndex % colors.length]; // Actualiza la copia con el nuevo color
              colorIndex++;
            }
    
            acc[key].y.push(item[9]); // Asumiendo que el valor de interés está en el índice 9
            acc[key].text.push(`Sample ID: ${item[0]}`);
        }
            return acc;
        }, {});
        setScatterColors(newScatterColors);

        // Convertir el objeto resultante en un arreglo de sus valores
        return Object.values(result);
    };
    

    useEffect(() => {

        // Llamar a fetchProjectIds y pasar selectedColumn y su índice correspondiente
        const columnIndex = otus?.data?.columns.indexOf(selectedColumn);
        fetchProjectIds(otus, columnIndex)

    }, [accessToken, selectedColumn, selectedLocations, currentLocation]);

    // Manejar cambio de locación
    useEffect(() => {
        if (otus && currentLocation) {
            const filteredData = otus?.data?.data?.filter((item: string[]) => selectedLocations.includes(item[1])) || [];
            processData(filteredData, Number(selectedColumn)); // Fix: Convert selectedColumn to a number
        } else if (otus) {
            processData(otus.data.data.data, Number(selectedColumn)); // Fix: Convert selectedColumn to a number
        }
    }, [currentLocation, selectedColumn, otus]);


    // Manejar cambio de locación
    useEffect(() => {
        const columnIndex = otus?.data?.columns.indexOf(selectedColumn);
        if (otus && currentLocation) {
            const filteredData = otus.data.data.filter((item: any[]) => item[1] === currentLocation);
            processData(filteredData, columnIndex);
        } else if (otus) {
            processData(otus.data, columnIndex)
        }
    }, [currentLocation, selectedColumn, otus]);


    useEffect(() => {
        const columnIndex = otus?.data?.columns.indexOf(selectedColumn);
        fetchToken().then((token) => { fetchConfigFile(token); fetchData(token, columnIndex).then((result) => { fetchProjectIds(result, columnIndex) }) });
    }, [projectId]);


    const handleLocationChange = (event: any) => {
        if (event === 'all') {
            setSelectedLocations(['cecum', 'feces', 'ileum']);
            setSelectedColumn("samplelocation");
            setIsColorByDisabled(true); // Ocultar el select de tratamiento si se selecciona 'All'
        } else {
            setSelectedLocations([event]);
            setIsColorByDisabled(false); // Mostrar el select de tratamiento cuando se selecciona una location específica
        }
    };

    const handleLocationChangeColorby = (event: any) => {
        setSelectedColumn(event.target.value);
        console.log(newScatterColors)
        console.log(scatterColors)
    };



    const filter = (
        <div className={`flex flex-col w-full p-4 bg-white rounded-lg  dark:bg-gray-800 `}>
            <div className={`tab-content `}>



                <div className="flex flex-col items-left space-x-2">

                    <h3 className="mb-5 text-base font-medium text-gray-900 dark:text-white">Select an option</h3>
                    <select id="location" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        value={currentLocation === "all" ? currentLocation : selectedLocations}
                        onChange={(e) => handleLocationChange(e.target.value)}>
                        <option selected value="all">All Locations</option>
                        {availableLocations.map((location) => (
                            <option key={location} value={location}>
                                {location.charAt(0).toUpperCase() + location.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>


            </div>

            <div className="mt-10">

                <h3 className="mb-5 text-lg font-medium text-gray-900 dark:text-white">Color by</h3>
                <ul className="grid gap-6 md:grid-cols-2">
                    <li>
                        <input type="radio" id="none" name="none" value="none" className="hidden peer" required checked={isColorByDisabled ? true : selectedColumn === 'samplelocation'}
                            onChange={handleLocationChangeColorby}
                            disabled={isColorByDisabled} />
                        <label htmlFor="none" className={`flex items-center justify-center w-full p-1 text-center text-gray-500 bg-white border border-gray-200 rounded-2xl dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-custom-green-400 peer-checked:border-custom-green-400 peer-checked:text-custom-green-500 cursor-pointer hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700`}>
                            <div className="block">
                                <div className="w-full text-center flex justify-center">Default</div>
                            </div>

                        </label>
                    </li>
                    <li>
                        <input type="radio" id="treatment" name="treatment" value="treatment" className="hidden peer" checked={isColorByDisabled ? false : selectedColumn === 'treatment'}
                            onChange={handleLocationChangeColorby}
                            disabled={isColorByDisabled} />
                        <label htmlFor="treatment" className={`flex items-center justify-center w-full p-1 text-gray-500 bg-white border border-gray-200 rounded-2xl dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-custom-green-400 peer-checked:border-custom-green-400 peer-checked:text-custom-green-500  ${isColorByDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:text-gray-600 hover:bg-gray-100'}  dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700`}>
                            <div className="block">
                                <div className="w-full">Treatment</div>
                            </div>

                        </label>
                    </li>
                    <li>
                        <input type="radio" id="age" name="age" value="age" className="hidden peer" checked={isColorByDisabled ? false : selectedColumn === 'age'}
                            onChange={handleLocationChangeColorby} />
                        <label htmlFor="age" className={`flex items-center justify-center w-full p-1 text-gray-500 bg-white border border-gray-200 rounded-2xl dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-custom-green-400 peer-checked:border-custom-green-400 peer-checked:text-custom-green-500  ${isColorByDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:text-gray-600 hover:bg-gray-100'}  dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700`}>
                            <div className="block">
                                <div className="w-full">Age</div>
                            </div>

                        </label>
                    </li>
                    {colorByOptions.map((option, index) => (
                        <li key={index}>
                            <input
                                type="radio"
                                id={option}
                                name={option}
                                className="hidden peer"
                                value={option}
                                checked={isColorByDisabled ? false : selectedColumn === option}
                                onChange={handleLocationChangeColorby}
                                disabled={isColorByDisabled}
                            />
                            <label
                                htmlFor={option}
                                className={`flex items-center justify-center ${isColorByDisabled
                                    ? 'cursor-not-allowed'
                                    : 'cursor-pointer hover:text-gray-600 hover:bg-gray-100'
                                    } w-full p-1 text-gray-500 bg-white border border-gray-200 rounded-2xl dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-custom-green-400 peer-checked:border-custom-green-400 peer-checked:text-custom-green-500  dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700`}
                            >
                                <div className="block">
                                    <div className="w-full">{(option as string).charAt(0).toUpperCase() + (option as string).replace('_', ' ').slice(1)}</div>
                                </div>
                            </label>
                        </li>
                    ))}
                </ul>
            </div>

        </div>
    );




type ShannonData = {
    name: string;
    // Add other properties as needed
  };
  
  type ScatterColors = {
    [key: string]: string;
    // Add other properties as needed
  };
  
// Componente de leyenda modificado para usar scatterColors para asignar colores consistentemente
const CustomLegend = ({ shannonData, scatterColors }: { shannonData: ShannonData[]; scatterColors: ScatterColors }) => (
    <div style={{ marginLeft: '20px' }}>
        {shannonData
          .filter(entry => entry.name !== "null") // Filtra las entradas donde name no es null
          .map((entry, index) => ({
              ...entry,
              color: scatterColors[entry.name],
          }))
          .map((entry, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ width: '15px', height: '15px', backgroundColor: scatterColors[entry.name], marginRight: '10px' }}></div>
                  <div>{entry.name}</div>
              </div>
          ))}
    </div>
);


  
  
  
const MyPlotComponent = ({ shannonData, scatterColors }: { shannonData: ShannonData[]; scatterColors: ScatterColors }) => (
    <div className="flex flex-row w-full items-start">
      <div className="w-9/12 flex " ref={plotContainerRef}>
    {loaded && (
    <Plot
 data={Object.values(shannonData.filter(entry => entry.name !== "null")).map(item => ({ ...(item as object), type: "box", marker: { color: scatterColors[item.name] }}))}      layout={{
    width: plotWidth || undefined, // Utiliza plotWidth o cae a 'undefined' si es 0
    height: 600,
        title: `Alpha Shannon${isColorByDisabled ? " por Ubicación" : (selectedColumn === "" || selectedColumn === "none" ? " en " + selectedLocations : (" por " + selectedColumn + " en ") + selectedLocations)}`,
        showlegend: false, // Oculta la leyenda de Plotly
      }}
    />
    )}
    </div>
    <div className="w-3/12 flex flex-col  border border-gray-100 rounded-3xl p-5 overflow-auto max-h-full">
        <h2 className="mb-3 text-xl ">{colorBy === "none" ? "Sample location" : colorBy}</h2>
            <CustomLegend shannonData={shannonData} scatterColors={scatterColors}  />
</div>
  </div>
  
  );
  


    return (
        <div>
        <Layout slug={projectId} filter={""} >
          {isLoaded ? (
  <div className="flex flex-col w-full">
  
  <h1 className="text-3xl my-5">Alpha diversity</h1>
    <div className="px-6 py-8">
    <div className={`prose ${Object.keys(configFile?.alphadiversity?.text || {}).length === 1 ? 'single-column' : 'column-text'}`}>
    {Object.entries(configFile?.alphadiversity?.text || {}).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([key, value]) => (
      <p key={key} className="text-gray-700 text-justify text-xl">
        {value as React.ReactNode}
      </p>
    ))}
  </div>
    </div>
    <div className="flex">
                                <GraphicCard filter={filter}>
                                    {shannonData.length > 0 ? (
                                        <MyPlotComponent shannonData={shannonData as ShannonData[]} scatterColors={scatterColors} />
                                    ) : (
                                        <SkeletonCard width={"500px"} height={"270px"} />
                                    )}
                                </GraphicCard>
                                </div>
  <div className="px-6 py-8" >
  <div className="grid gap-10" style={{ gridTemplateColumns: '1fr 1fr' }}>
  {Object.entries(configFile?.alphadiversity?.graph || {}).map(([key, value]) => {
    if (key === "samplelocation" && selectedLocations.length > 1 && typeof value === 'object' && value !== null) {
      const entries = Object.entries(value);
      const isSingleEntry = entries.length === 1;  // Verificar si solo hay una entrada

      return entries.map(([subKey, subValue]) => (
        <div key={subKey} className={isSingleEntry ? "col-span-2" : ""}>  
          <p className="text-gray-700 m-3 text-justify text-xl">{subValue}</p>
        </div>
      ));
    } else if (typeof value === 'string') {
      return (
        <div key={key} className="col-span-2">  
          <p className="text-gray-700 m-3 text-justify text-xl">{value}</p>
        </div>
      );
    }
    return null;  // No renderizar nada si no se cumplen las condiciones
  })}
</div>



<div className="prose flex flex-row flex-wrap">
  {Object.entries(configFile?.alphadiversity?.graph || {}).map(([key, value]) => {
    if (key === selectedColumn && key !== "samplelocation") {
      if (typeof value === 'object' && value !== null) {
        const entries = Object.entries(value);
        const isSingleEntry = entries.length === 1; // Verificar si hay una sola entrada

        return entries.map(([subKey, subValue]) => (
          <div key={subKey} className={isSingleEntry ? "w-full" : "w-1/2"}> 
            <p className="text-gray-700 m-3 text-justify text-xl">{subValue}</p>
          </div>
        ));
      } else if (typeof value === 'string') {
        // Las cadenas siempre ocupan la mitad de la columna, pero puedes cambiar esto si lo deseas
        return (
          <div className="w-full" key={key}> 
            <p className="text-gray-700 m-3 text-justify text-xl">{value}</p>
          </div>
        );
      }
    }
    return null;
  })}
</div>


  </div>
</div>

        ) : (
          <div>Loading...</div>
        )}
            </Layout>
        </div>
    );
}
