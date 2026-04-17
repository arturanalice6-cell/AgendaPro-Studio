
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'professional');

-- Create business status enum
CREATE TYPE public.business_status AS ENUM ('trial', 'active', 'blocked');

-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'barbearia',
  phone TEXT,
  whatsapp TEXT,
  cover_url TEXT,
  logo_url TEXT,
  status business_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_businesses_slug ON public.businesses(slug);
CREATE INDEX idx_businesses_user_id ON public.businesses(user_id);

-- Services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  category TEXT NOT NULL DEFAULT 'geral',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_services_business_id ON public.services(business_id);

-- Work schedules table
CREATE TABLE public.work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (business_id, day_of_week)
);
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

-- Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'confirmed',
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_appointments_business_id ON public.appointments(business_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-assign professional role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'professional');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- user_roles: users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- businesses: owner can CRUD, public can read by slug
CREATE POLICY "Owner can manage own business" ON public.businesses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view businesses" ON public.businesses FOR SELECT TO anon USING (true);
CREATE POLICY "Admins can view all businesses" ON public.businesses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all businesses" ON public.businesses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- services: owner can CRUD via business, public can read
CREATE POLICY "Owner can manage services" ON public.services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid())
);
CREATE POLICY "Public can view active services" ON public.services FOR SELECT TO anon USING (active = true);

-- work_schedules: owner can CRUD, public can read
CREATE POLICY "Owner can manage schedules" ON public.work_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid())
);
CREATE POLICY "Public can view schedules" ON public.work_schedules FOR SELECT TO anon USING (true);

-- appointments: owner can read/update, anyone can create
CREATE POLICY "Owner can view appointments" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid())
);
CREATE POLICY "Owner can update appointments" ON public.appointments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid())
);
CREATE POLICY "Anyone can create appointments" ON public.appointments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can create appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);

-- Storage bucket for business images
INSERT INTO storage.buckets (id, name, public) VALUES ('business-assets', 'business-assets', true);

CREATE POLICY "Anyone can view business assets" ON storage.objects FOR SELECT USING (bucket_id = 'business-assets');
CREATE POLICY "Authenticated users can upload business assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'business-assets');
CREATE POLICY "Users can update own business assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'business-assets');
CREATE POLICY "Users can delete own business assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'business-assets');
