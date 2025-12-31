
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xihgmsmdcpufeennodlg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaGdtc21kY3B1ZmVlbm5vZGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzI5OTAsImV4cCI6MjA4MTY0ODk5MH0.BpDOOANvcTZG_gboCQKerVzWsbUiq_DACBzdBE3vJm8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreate() {
    console.log('Attempting to create a shift...');
    const { data, error } = await supabase
        .from('schedules')
        .insert({
            title: 'Test From Agent',
            start_time: '2025-12-31T08:00:00Z',
            end_time: '2025-12-31T20:00:00Z',
            type: 'ORDINARY'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating shift:', error);
    } else {
        console.log('Shift created successfully:', data);
    }
}

testCreate();
