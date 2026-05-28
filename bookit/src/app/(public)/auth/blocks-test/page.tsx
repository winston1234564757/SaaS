import { StatsMosaicWidget } from '@/components/master/dashboard/widgets/StatsMosaicWidget';
import { InsightsRow } from '@/components/master/dashboard/widgets/InsightsRow';
import { QuickActionsWidget } from '@/components/master/dashboard/widgets/QuickActionsWidget';
import { FreeSlotsWidget } from '@/components/master/dashboard/widgets/FreeSlotsWidget';
import { TopServicesWidget } from '@/components/master/dashboard/widgets/TopServicesWidget';
import { ChannelHealthWidget } from '@/components/master/dashboard/widgets/ChannelHealthWidget';

export default function BlocksTest() {
  return (
    <div style={{ background: '#DDD5C6', minHeight: '100vh', padding: '16px 16px 80px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '420px' }}>
      <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#888', margin: 0 }}>blocks-test</p>
      <div data-block="StatsMosaicWidget"><p style={{ fontFamily: 'monospace', fontSize: 9, color: '#999', marginBottom: 6 }}>StatsMosaicWidget</p><StatsMosaicWidget /></div>
      <div data-block="InsightsRow"><p style={{ fontFamily: 'monospace', fontSize: 9, color: '#999', marginBottom: 6 }}>InsightsRow</p><InsightsRow /></div>
      <div data-block="QuickActionsWidget"><p style={{ fontFamily: 'monospace', fontSize: 9, color: '#999', marginBottom: 6 }}>QuickActionsWidget</p><QuickActionsWidget /></div>
      <div data-block="FreeSlotsWidget"><p style={{ fontFamily: 'monospace', fontSize: 9, color: '#999', marginBottom: 6 }}>FreeSlotsWidget</p><FreeSlotsWidget /></div>
      <div data-block="TopServicesWidget"><p style={{ fontFamily: 'monospace', fontSize: 9, color: '#999', marginBottom: 6 }}>TopServicesWidget</p><TopServicesWidget /></div>
      <div data-block="ChannelHealthWidget"><p style={{ fontFamily: 'monospace', fontSize: 9, color: '#999', marginBottom: 6 }}>ChannelHealthWidget</p><ChannelHealthWidget /></div>
    </div>
  );
}
