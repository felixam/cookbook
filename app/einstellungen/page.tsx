'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [recipeModel, setRecipeModel] = useState('');
  const [modelLoading, setModelLoading] = useState(true);

  // Fetch settings on mount
  useEffect(() => {
    fetch('/api/settings/model')
      .then(res => res.json())
      .then(data => {
        if (data.model) setRecipeModel(data.model);
      })
      .catch(console.error)
      .finally(() => setModelLoading(false));
  }, []);

  async function handleModelChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newModel = e.target.value;
    setRecipeModel(newModel);
    
    try {
      const res = await fetch('/api/settings/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: newModel }),
      });
      
      if (res.ok) {
        toast.success('Modell aktualisiert');
      } else {
        toast.error('Fehler beim Speichern');
      }
    } catch {
      toast.error('Verbindungsfehler');
    }
  }

  async function handleChangePin(e: React.FormEvent) {
    e.preventDefault();

    if (newPin.length < 4) {
      toast.error('PIN muss mindestens 4 Zeichen haben');
      return;
    }

    if (newPin !== confirmPin) {
      toast.error('PINs stimmen nicht überein');
      return;
    }

    setLoading(true);

    try {
      // First verify current PIN
      const verifyRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: currentPin }),
      });

      if (!verifyRes.ok) {
        toast.error('Aktueller PIN ist falsch');
        return;
      }

      // Then set new PIN (we need a new endpoint for this)
      const changeRes = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin }),
      });

      if (!changeRes.ok) {
        const data = await changeRes.json();
        toast.error(data.error || 'Fehler beim Ändern des PINs');
        return;
      }

      toast.success('PIN erfolgreich geändert');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch {
      toast.error('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Fehler beim Abmelden');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Einstellungen" />

      <main className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>KI-Modell Einstellungen</CardTitle>
            <CardDescription>
              Wähle das KI-Modell für die Rezept-Erkennung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="model">Modell</Label>
              <div className="relative">
                <select
                  id="model"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  value={recipeModel}
                  onChange={handleModelChange}
                  disabled={modelLoading}
                >
                  <option value="openai/gpt-5">GPT-5 (Standard)</option>
                  <option value="google/gemini-3-pro">Google Gemini 3 Pro</option>
                  <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                  <option value="anthropic/claude-4.5-sonnet">Anthropic Claude 4.5 Sonnet</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PIN ändern</CardTitle>
            <CardDescription>
              Ändere den PIN für dein Familienkochbuch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPin">Aktueller PIN</Label>
                <Input
                  id="currentPin"
                  type="password"
                  inputMode="numeric"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPin">Neuer PIN</Label>
                <Input
                  id="newPin"
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  minLength={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPin">PIN bestätigen</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  minLength={4}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Speichern...' : 'PIN ändern'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Abmelden</CardTitle>
            <CardDescription>
              Melde dich von diesem Gerät ab
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? 'Abmelden...' : 'Abmelden'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Über</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Familienrezepte v1.0
            </p>
            <p className="text-sm text-muted-foreground">
              Dein digitales Familienkochbuch
            </p>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
