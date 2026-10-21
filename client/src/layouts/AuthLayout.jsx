import { Outlet } from 'react-router-dom'
import campusImage from '../assets/University_bgImg.png'
import logo from '../assets/IGNTU_logo.png'

function AuthLayout() {
  return (
    <main className="relative isolate h-dvh overflow-hidden bg-[#42100f]">
      <img
        alt="IGNTU campus"
        className="absolute inset-0 size-full object-cover object-center"
        src={campusImage}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-black/35"
      />
      <header className="absolute left-5 top-5 z-10 flex items-center gap-3 text-white drop-shadow sm:left-8 sm:top-7">
        <span
          aria-hidden="true"
          className="grid size-11 place-items-center rounded-full border-2 border-amber-200 bg-[#8f1024] text-xs font-black tracking-wide text-amber-50 shadow-lg"
        >
          <img src={logo}/>
        </span>
        <span className="hidden text-xs font-semibold leading-tight xl:block xl:text-sm">
          Indira Gandhi National Tribal University
          <span className="block font-normal text-white/85">Hostel Mess Management System</span>
        </span>
      </header>

      <section className="absolute bottom-10 left-6 z-10 hidden max-w-lg text-white drop-shadow-lg lg:bottom-14 lg:left-14 lg:block">
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
          Good Food
          <br />
          <span className="text-amber-300">Better Days</span>
        </h1>
        <p className="mt-3 max-w-sm text-sm font-medium text-white/90 sm:text-base">
          Healthy meals for a brighter tomorrow at IGNTU.
        </p>
      </section>

      <section className="absolute inset-x-4 bottom-4 top-24 z-10 flex items-center justify-center overflow-y-auto rounded-2xl bg-white px-6 py-8 shadow-2xl sm:inset-x-auto sm:bottom-8 sm:right-8 sm:top-8 sm:w-[min(460px,calc(100vw-4rem))] sm:px-10 sm:py-10 lg:right-[7vw] lg:w-[min(460px,42vw)]">
        <div className="my-auto w-full max-w-md">
          <Outlet />
        </div>
      </section>
    </main>
  )
}

export default AuthLayout
