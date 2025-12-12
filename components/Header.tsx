"use client";

import { Search, Menu, ShieldCheck, MapPin, Phone, Mail, FileText, Info, X } from "lucide-react";
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
    />
  );
}

export default function Header() {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();

  return (
    <Navbar maxWidth="2xl" isBordered className="bg-background/70 backdrop-blur-md">
      <NavbarContent justify="start">
        <NavbarBrand className="gap-3 mr-4 cursor-pointer" onClick={() => window.location.href='/'}>
          <div className="relative h-10 w-10">
            <Image 
              src="/logo.png"
              alt="Nandan"
              fill
              className="object-contain dark:invert filter"
              priority
            />
          </div>
          <p className="hidden sm:block font-bold text-inherit uppercase tracking-widest">Nandan Trader</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent as="div" className="items-center" justify="center">
        <Suspense fallback={<div className="w-[20rem]" />}>
          <SearchInput />
        </Suspense>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem className="hidden sm:flex">
          <ThemeToggle />
        </NavbarItem>
        <NavbarItem>
          <Button isIconOnly variant="light" onPress={onOpen} aria-label="Open Menu">
            <Menu size={24} />
          </Button>
        </NavbarItem>
      </NavbarContent>

      {/* Mobile Menu (Simulated Drawer using Modal) */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        placement="center" 
        backdrop="blur"
        scrollBehavior="inside"
        classNames={{
          wrapper: "flex justify-end",
          base: "h-[100dvh] w-[85vw] sm:w-[350px] m-0 rounded-none rounded-l-2xl",
        }}
        motionProps={{
          variants: {
            enter: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
            exit: { x: "100%", opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
          }
        }}
      >
        <ModalContent>
          {(onClose: () => void) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b border-divider p-6">
                 <div className="flex items-center justify-between">
                    <span className="text-xl font-bold uppercase">Menu</span>
                    <div className="sm:hidden"><ThemeToggle /></div>
                 </div>
              </ModalHeader>
              <ModalBody className="gap-2 p-6">
                <Button 
                  as="a" href="/about" variant="flat" className="justify-start h-14 text-md font-medium"
                  startContent={<Info size={20} className="text-default-500" />}
                >
                  About Us
                </Button>
                <Button 
                  as="a" href="/terms" variant="flat" className="justify-start h-14 text-md font-medium"
                  startContent={<FileText size={20} className="text-default-500" />}
                >
                  Terms & Conditions
                </Button>
                <Button 
                  as="a" href="/privacy" variant="flat" className="justify-start h-14 text-md font-medium"
                  startContent={<ShieldCheck size={20} className="text-default-500" />}
                >
                  Privacy Policy
                </Button>

                <div className="mt-auto pt-8">
                  <div className="p-4 bg-default-100 rounded-medium space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="shrink-0 mt-1 text-default-500" />
                      <span className="text-small text-default-500">Khapriyawan, Barkagaon Road,<br/>Hazaribagh, Jharkhand - 825302</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="shrink-0 text-default-500" />
                      <div className="flex flex-col">
                        <a href="https://wa.me/919431394095" className="text-small font-bold text-success-600 hover:underline">WhatsApp: 94313-94095</a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="shrink-0 text-default-500" />
                      <a href="mailto:nandantrader1963@gmail.com" className="text-small text-default-600 hover:underline">nandantrader1963@gmail.com</a>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="w-full text-center text-tiny text-default-400 font-bold uppercase tracking-widest">
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