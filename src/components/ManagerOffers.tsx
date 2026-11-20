import { BriefcaseBusiness, Check, X } from "lucide-react";
import { teams } from "@/data/teams";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getDefaultBudget } from "@/utils/teamBudgets";
import type { ManagerOffer } from "@/utils/managerOffers";

interface Props {
  offers: ManagerOffer[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export function ManagerOfferList({ offers, onAccept, onDecline }: Props) {
  return <div className="space-y-3 text-left">
    {offers.map(offer => {
      const club = teams.find(t => t.name === offer.club);
      return <article key={offer.id} className="rounded-lg border border-border bg-card p-4 text-card-foreground">
        <div className="flex min-w-0 items-center gap-3">
          <img src={club?.logo} alt="" className="h-12 w-12 shrink-0 object-contain" />
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-base font-bold">{offer.club}</h3>
            <p className="text-xs text-muted-foreground">Caixa inicial: $ {(getDefaultBudget(offer.club) / 1000000).toFixed(1)} M</p>
          </div>
          <BriefcaseBusiness className="h-5 w-5 shrink-0 text-primary" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => onDecline(offer.id)} aria-label={`Recusar proposta do ${offer.club}`}><X /> Recusar</Button>
          <Button onClick={() => onAccept(offer.id)} aria-label={`Aceitar proposta do ${offer.club}`}><Check /> Aceitar</Button>
        </div>
      </article>;
    })}
  </div>;
}

export function ManagerOffersModal(props: Props & { open: boolean; onClose: () => void }) {
  return <Dialog open={props.open} onOpenChange={open => { if (!open) props.onClose(); }}>
    <DialogContent className="z-[80] max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg p-5">
      <DialogHeader>
        <DialogTitle>Proposta para treinador</DialogTitle>
        <DialogDescription>Um novo clube quer contratar você.</DialogDescription>
      </DialogHeader>
      <ManagerOfferList {...props} />
    </DialogContent>
  </Dialog>;
}