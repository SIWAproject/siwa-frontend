'use client'

import { useEffect, useState } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { TabView, TabPanel } from 'primereact/tabview'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { MultiSelect } from 'primereact/multiselect'
import { motion } from 'framer-motion'
import { FaSpinner } from 'react-icons/fa6'
import Layout from '../../components/Layout'
import { SidebarProvider } from '../../components/context/sidebarContext'

type Project = {
  project_id: string
  tipo_de_animal: string
  specie: string
  nombre_del_proyecto: string
}

type UserProject = {
  email: string
  projects: string
}

export default function Dashboard({ params }: { params: { slug: string } }) {
  const [loading, setLoading] = useState(false)
  const [projectDetails, setProjectDetails] = useState<Project[]>([])
  const [usersProjects, setUsersProjects] = useState<UserProject[]>([])
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editUserIndex, setEditUserIndex] = useState<number | null>(null)
  const [newProject, setNewProject] = useState<Project>({
    project_id: '',
    tipo_de_animal: '',
    specie: '',
    nombre_del_proyecto: '',
  })
  const [newUser, setNewUser] = useState<UserProject>({
    email: '',
    projects: ''
  })
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH0_BASE_URL}/api/admin/projects`, {
            headers: { Authorization: `Bearer ${params.slug}` },
        });
        if (!response.ok) throw new Error('Failed to fetch project details');
        const data = await response.json();
        setProjectDetails(data);
    } catch (error) {
        console.error('Error fetching project details:', error);
        toast.error('Error al cargar detalles de proyectos');
    } finally {
        setLoading(false);
    }
};


  const fetchUsersProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH0_BASE_URL}/api/admin/users-projects`, {
        headers: { Authorization: `Bearer ${params.slug}` },
      })
      if (!response.ok) throw new Error('Failed to fetch user projects')
      const data = await response.json()
      const formattedData: UserProject[] = Object.entries(data).map(([email, projectIds]) => ({
        email,
        projects: Array.isArray(projectIds) ? projectIds.join(', ') : String(projectIds),
    }));
      setUsersProjects(formattedData)
    } catch (error) {
      console.error('Error fetching user projects:', error)
      toast.error('Error al cargar datos de usuarios y proyectos')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (index: number) => setEditIndex(index)
  const handleEditUserClick = (index: number) => {
    setEditUserIndex(index)
    const user = usersProjects[index]
    const assignedProjects = user.projects.split(', ').map(proj => proj.trim())
    setSelectedProjects(assignedProjects)
  }

  const handleSaveClick = async (index: number) => {
    const project = projectDetails[index]
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH0_BASE_URL}/api/admin/projects-edit/${project.project_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${params.slug}`,
        },
        body: JSON.stringify(project),
      })
      if (!response.ok) throw new Error('Failed to update project details')
      toast.success('Detalles del proyecto actualizados con éxito')
      setEditIndex(null)
    } catch (error) {
      console.error('Error updating project details:', error)
      toast.error('Error al actualizar detalles del proyecto')
    }
  }

  const handleSaveUserClick = async (index: number) => {
    const user = usersProjects[index];
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH0_BASE_URL}/api/admin/users-projects`, {
            method: 'PUT', // Cambiado a PUT
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${params.slug}`,
            },
            body: JSON.stringify({ user_id: user.email, project_id: selectedProjects }),
        });
        if (!response.ok) throw new Error('Failed to update user details');
        toast.success('Usuario actualizado con éxito');
        setEditUserIndex(null);
    } catch (error) {
        console.error('Error updating user details:', error);
        toast.error('Error al actualizar usuario');
    }
};




const handleClearCache = async () => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH0_BASE_URL}/api/admin/clear-cache`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${params.slug}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to clear cache');
        }

        toast.success('Cache cleared successfully');
    } catch (error) {
        console.error('Error clearing cache:', error);
        toast.error('Error al limpiar el cache');
    }
};





  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Project, index: number) => {
    const updatedProjects = [...projectDetails]
    updatedProjects[index][field] = e.target.value
    setProjectDetails(updatedProjects)
  }

  const handleNewProjectChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Project) => {
    setNewProject({ ...newProject, [field]: e.target.value })
  }

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof UserProject) => {
    setNewUser({ ...newUser, [field]: e.target.value })
  }

  const handleAddNewProject = async () => {
    if (Object.values(newProject).some(value => !value)) {
      toast.error('Todos los campos son obligatorios para agregar un proyecto')
      return
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH0_BASE_URL}/api/admin/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${params.slug}`,
        },
        body: JSON.stringify(newProject),
      })
      if (!response.ok) throw new Error('Failed to add new project')
      toast.success('Nuevo proyecto agregado con éxito')
      fetchProjectDetails()
      setNewProject({ project_id: '', tipo_de_animal: '', specie: '', nombre_del_proyecto: '' })
    } catch (error) {
      console.error('Error adding new project:', error)
      toast.error('Error al agregar nuevo proyecto')
    }
  }

  const handleAddNewUser = async () => {
    if (!newUser.email || selectedProjects.length === 0) {
      toast.error('El email y al menos un proyecto son obligatorios para agregar un usuario')
      return
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH0_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${params.slug}`,
        },
        body: JSON.stringify({ email: newUser.email, projects: selectedProjects }),
      })
      if (!response.ok) throw new Error('Failed to add new user')
      toast.success('Nuevo usuario agregado con éxito')
      fetchUsersProjects()
      setNewUser({ email: '', projects: '' })
      setSelectedProjects([])
    } catch (error) {
      console.error('Error adding new user:', error)
      toast.error('Error al agregar nuevo usuario')
    }
  }

  useEffect(() => {
    fetchProjectDetails()
  }, [params.slug])

  return (
    <div className="h-full bg-gray-100">
      <SidebarProvider>
        <Layout slug={params.slug} filter="" breadcrumbs="">
          <motion.div
            className="p-6 w-full h-full"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {loading ? (
              <div className="flex justify-center items-center">
                <FaSpinner className="animate-spin text-4xl text-primary" />
                <span className="ml-2 text-xl font-semibold">Cargando...</span>
              </div>
            ) : (
                <>
                <Button 
  label="Limpiar Caché" 
  icon="pi pi-trash" 
  onClick={handleClearCache} 
  className="p-button-danger mt-4" 
/>
              <div className="bg-white rounded-lg shadow-md flex w-full h-full overflow-scroll">
                <TabView className='w-full' aria-orientation='vertical'>
                <TabPanel header="Detalles de Proyectos">
              <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">Agregar Nuevo Proyecto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <InputText
                            placeholder="ID Proyecto"
                            value={newProject.project_id}
                            onChange={(e) => handleNewProjectChange(e, "project_id")}
                          />
                          <InputText
                            placeholder="Tipo de Animal"
                            value={newProject.tipo_de_animal}
                            onChange={(e) => handleNewProjectChange(e, "tipo_de_animal")}
                          />
                          <InputText
                            placeholder="Especie"
                            value={newProject.specie}
                            onChange={(e) => handleNewProjectChange(e, "specie")}
                          />
                          <InputText
                            placeholder="Nombre del Proyecto"
                            value={newProject.nombre_del_proyecto}
                            onChange={(e) => handleNewProjectChange(e, "nombre_del_proyecto")}
                          />
                        </div>
                        <Button label="Agregar Proyecto" icon="pi pi-plus" onClick={handleAddNewProject} className="mt-4" />
                      </div>
                    <div className="p-4">
                      <DataTable value={projectDetails} responsiveLayout="scroll" stripedRows className="mb-6">
                        <Column field="project_id" header="ID Proyecto" sortable />
                        <Column
                          field="tipo_de_animal"
                          header="Tipo de Animal"
                          sortable
                          body={(rowData, { rowIndex }) =>
                            editIndex === rowIndex ? (
                              <InputText
                                value={rowData.tipo_de_animal}
                                onChange={(e) => handleInputChange(e, "tipo_de_animal", rowIndex)}
                              />
                            ) : (
                              rowData.tipo_de_animal
                            )
                          }
                        />
                        <Column
                          field="specie"
                          header="Especie"
                          sortable
                          body={(rowData, { rowIndex }) =>
                            editIndex === rowIndex ? (
                              <InputText
                                value={rowData.specie}
                                onChange={(e) => handleInputChange(e, "specie", rowIndex)}
                              />
                            ) : (
                              rowData.specie
                            )
                          }
                        />
                        <Column
                          field="nombre_del_proyecto"
                          header="Nombre del Proyecto"
                          sortable
                          body={(rowData, { rowIndex }) =>
                            editIndex === rowIndex ? (
                              <InputText
                                value={rowData.nombre_del_proyecto}
                                onChange={(e) => handleInputChange(e, "nombre_del_proyecto", rowIndex)}
                              />
                            ) : (
                              rowData.nombre_del_proyecto
                            )
                          }
                        />
                        <Column
                          body={(_, { rowIndex }) =>
                            editIndex === rowIndex ? (
                              <Button label="Guardar" icon="pi pi-check" onClick={() => handleSaveClick(rowIndex)} />
                            ) : (
                              <Button label="Editar" icon="pi pi-pencil" onClick={() => handleEditClick(rowIndex)} />
                            )
                          }
                          header="Acciones"
                        />
                      </DataTable>

                  
                    </div>
                  </TabPanel>
         
                </TabView>
              </div>
                </>
            )}
          </motion.div>
        </Layout>
      </SidebarProvider>
      <ToastContainer />
    </div>
  )
}
