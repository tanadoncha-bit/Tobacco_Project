import { createProfileAction } from "@/action/action"
import AvatarUploader from "@/components/form/AvatarUploader"
import { SubmitButton } from "@/components/form/Buttons"
import DatePickerField from "@/components/form/DatePickerField"
import FormContainer from "@/components/form/FormContainer"
import FormInput from "@/components/form/FormInput"

const CreateProfile = async() => {
  return (
    <section className="flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md rounded-2xl bg-background p-8 shadow-lg border border-gray-220 dark:border-gray-800">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tell us a little about yourself
          </p>
        </div>

        {/* Form */}
        <FormContainer action={createProfileAction} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4 mt-4 justify-center">
            <div className="md:col-span-2">
              <AvatarUploader />
            </div>
            <FormInput name="firstname" label="Firstname" type="text" placeholder="Enter your firstname" />
            <FormInput name="lastname" label="Lastname" type="text" placeholder="Enter your lastname" />
            {/* <div className="md:col-span-2">
              <FormInput name="username" label="Username" type="text" placeholder="Enter your username" />
            </div>
            <div className="md:col-span-2">
              <FormInput name="password" label="Password" type="text" placeholder="Enter your password" />
            </div> */}
            <div className="md:col-span-2">
              <FormInput name="email" label="Email" type="email" placeholder="Enter your email" />
            </div>
            <div className="md:col-span-2">
              <FormInput name="address" label="Address" type="text" placeholder="Enter your address" />
            </div>
            <FormInput name="phonenumber" label="Phone Number" type="text" placeholder="Enter your number" />
            <DatePickerField name="birthdate" />
          </div>
          <SubmitButton text="Create Profile" size="lg" className="w-full rounded-full cursor-pointer" />
        </FormContainer>
      </div>
    </section>
  )
}

export default CreateProfile
