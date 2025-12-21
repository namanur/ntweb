"use client";

import { Search, Menu, ShieldCheck, MapPin, Phone, Mail, FileText } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Input,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";

function SearchInput() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set("q", term);
    else params.delete("q");
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Input
      classNames={{
        base: "max-w-full sm:max-w-[20rem] h-10",
        mainWrapper: "h-full",
        input: "text-small",
        inputWrapper: "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20",
      }}
      placeholder="Type to search..."
      size="sm"
      startContent={<Search size={18} />}
      type="search"
      defaultValue={searchParams.get("q")?.toString()}
      onValueChange={handleSearch}
      id="search-input"
    />
  );
}


export default function Header() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <Navbar
      maxWidth="2xl"
      position="sticky"
      className="bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-white/10 dark:border-white/5 supports-[backdrop-filter]:bg-white/50"
    >
      <NavbarContent justify="start">
        <NavbarBrand className="gap-3 mr-4 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="relative h-9 w-9 overflow-hidden rounded-lg shadow-sm">
            <Image
              src="/logo.png"
              alt="Nandan"
              fill
              className="object-contain dark:invert"
              priority
            />
          </div>
          <p className="hidden sm:block font-bold text-inherit uppercase tracking-widest text-sm">Nandan Trader</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent as="div" className="items-center gap-6" justify="center">
        {/* Desktop Nav - Focused on Actions */}

        <Suspense fallback={<div className="w-[20rem]" />}>
          <SearchInput />
        </Suspense>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem className="hidden sm:flex">
          <ThemeToggle />
        </NavbarItem>
        <NavbarItem>
          <Button isIconOnly variant="light" onPress={onOpen} aria-label="Open Menu" className="rounded-full">
            <Menu size={20} />
          </Button>
        </NavbarItem>
      </NavbarContent>

      {/* Mobile Menu (Simulated Drawer) */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        backdrop="blur"
        scrollBehavior="inside"
        classNames={{
          wrapper: "flex justify-end",
          base: "h-[100dvh] w-[85vw] sm:w-[350px] m-0 rounded-none rounded-l-3xl bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-l border-white/20",
          closeButton: "top-6 right-6 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
        }}
        motionProps={{
          variants: {
            enter: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } },
            exit: { x: "100%", opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
          }
        }}
      >
        <ModalContent>
          {(onClose: () => void) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b border-zinc-100 dark:border-zinc-800 p-8">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold uppercase tracking-tight">Menu</span>
                  <div className="sm:hidden"><ThemeToggle /></div>
                </div>
              </ModalHeader>
              <ModalBody className="gap-2 p-8">

                <Button
                  as="a" href="/terms" variant="light" className="justify-start h-12 text-base font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl px-4"
                  startContent={<FileText size={20} className="text-zinc-400" />}
                >
                  Terms & Conditions
                </Button>
                <Button
                  as="a" href="/privacy" variant="light" className="justify-start h-12 text-base font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl px-4"
                  startContent={<ShieldCheck size={20} className="text-zinc-400" />}
                >
                  Privacy Policy
                </Button>

                <div className="mt-auto pt-8">
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl space-y-5 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-start gap-4">
                      <MapPin size={18} className="shrink-0 mt-1 text-zinc-400" />
                      <span className="text-sm text-zinc-500 font-medium">Khapriyawan, Barkagaon Road,<br />Hazaribagh, Jharkhand - 825302</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Phone size={18} className="shrink-0 text-zinc-400" />
                      <div className="flex flex-col">
                        <a href="https://wa.me/919431394095" className="text-sm font-bold text-green-600 hover:underline">WhatsApp: 94313-94095</a>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Mail size={18} className="shrink-0 text-zinc-400" />
                      <a href="mailto:nandantrader1963@gmail.com" className="text-sm text-zinc-500 hover:text-black transition-colors">nandantrader1963@gmail.com</a>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="w-full text-center text-[11px] text-zinc-400 font-bold uppercase tracking-widest pb-4">
                  © {new Date().getFullYear()} Nandan Trader
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Navbar>
  );
}