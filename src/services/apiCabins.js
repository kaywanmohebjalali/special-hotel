import supabase from './supabase'
import { supabaseUrl } from '../services/supabase'












export async function getCabins() {
  
    const { data, error } = await supabase
        .from('cabins')
        .select('*')

    if (error) {
        throw new Error('cabin could not be loaded')
    }
    return data
}



export async function deleteCabin({ cabinId, image }) {



    try {
        const { data, error } = await supabase
            .from('cabins')
            .delete()
            .eq('id', cabinId)

        if (error) throw new Error('cabin could not be delete')


         let img =image? image.split('/').at(-1):''
        if(img && img!='default-cabin.png'){

            const { error: errorStorage } = await supabase
            .storage
            .from('cabin-images')
            .remove([image.split('/').at(-1)])
            
            if (errorStorage) throw new Error('error delete cabin previous  image in database')
        }
        
        
        
        return data

    } catch (error) {
        console.log('delete cabin : ', error.message);
        throw new Error('cabin could not be delete')
    }

}








export async function createOrEditCabin(newCabin, id,previousImage) {


    const hasImagePath = typeof newCabin?.image[0] == 'string'

    const imageName = `${Math.random()}-${newCabin?.image[0]?.name}`.replace('/', '')
    const imagePath = hasImagePath ? newCabin.image[0] : `${supabaseUrl}/storage/v1/object/public/cabin-images/${imageName}`

    let query = supabase.from('cabins')
    // CREATE
    if (!id) query = query.insert([{ ...newCabin, image: imagePath }])

    // Edit
    if (id) query = query.update([{ ...newCabin, image: imagePath }])
        .eq('id', id)




    const { data, error } = await query.select()
    if (error) {
        throw new Error(error.message)
    }


    //    upload image
    if (!hasImagePath) {
        const { error: storageError } = await supabase
            .storage
            .from('cabin-images')
            .upload(imageName, newCabin.image[0])

        if (storageError && !id) {
            await supabase
                .from('cabins')
                .delete()
                .eq('id', data.id)

            throw new Error('cabin image could not be uploaded and the cabin was not created')
        }
    }

    if (id && previousImage) {
        let img =previousImage? previousImage.split('/').at(-1):''
        if(img && img!='default-cabin.png'){
        const { error: errorStorage } = await supabase
        .storage
        .from('cabin-images')
        .remove([previousImage.split('/').at(-1)])
        
        if (errorStorage) throw new Error('error delete cabin previous  image in database')
    }
    }

    return data
}

