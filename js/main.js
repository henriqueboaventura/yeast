(function ($) {
    $.fn.slideDown = function (duration) {
        // show element if it is hidden (it is needed if display is none)
        this.show();

        // get naturally height
        var height = this.height();

        // set initial css for animation
        this.css({
            height: 0
        });

        // animate to gotten height
        this.animate({
            height: height
        }, duration);
    };

    $.fn.slideUp = function (duration) {
        // keep pointer to restore hidden height later
        var target = this;

        // get natural height
        var height = this.height();

        // set initial css for animation
        this.css({
            height: height
        });

        // animate to gotten height
        this.animate({
            height: 0
        },
        duration,
            '',

        function () {    // callback to 'reset' the height for the next slideDown event
            target.css({
                display: 'none',
                height: ''
            });
        });
    };
})(Zepto);

var YEAST = {
  dme: 0.36669970267592,
  type_fermentation: null,
  batch_volume: null,
  original_gravity: null,
  optimal_pitching_rate: null,
  yeast_cells_needed: null,
  initial_cell_count: null,
  viability: null,
  viable_cell_count: null,
  round: function(number, precision) {
    var factor = Math.pow(10, precision);
    var tempNumber = number * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
  },
  format_density: function(sg) {
    return parseInt(sg.replace('.', '')) - 1000;
  },
  pitching_rate: function(type, sg) {
    sg = YEAST.format_density(sg);
    if(type == 'lager') {
      result = (2*Math.pow(10,-8)*Math.pow(sg,4)) - (4*Math.pow(10,-6)*Math.pow(sg,3)) - (5*Math.pow(10,-5)*Math.pow(sg,2)) + (0.3818*sg) - (0.0482);
    } else {
      result = (-1*Math.pow(10,-8)*Math.pow(sg,4)) + (3*Math.pow(10,-6)*Math.pow(sg,3)) - (0.0004*Math.pow(sg,2)) + (0.1999*sg) - (0.0921);
      if(type == 'hybrid') {
        result = result * 1.3;
      }
    }

    YEAST.optimal_pitching_rate = result.toPrecision(3);
  },
  yeast_cells_need_calc: function(batch_volume, optimal_pitching_rate) {
    YEAST.yeast_cells_needed = Math.ceil(batch_volume * optimal_pitching_rate);
  },
  growth_calc: function(initial_cell_count, viability) {
    result = (viability * initial_cell_count)/100;
    YEAST.viable_cell_count = Math.ceil(result);
  },
}

Zepto(function($){

  $('legend').on('click', function(e) {
    var trigger = $(this);
    var elem = $(this).next();
    if(trigger.hasClass('closed') == false) {
      trigger.addClass('closed');
      elem.slideUp(250);
    } else {
      trigger.removeClass('closed');
      elem.slideDown(250);
    }
    return false;
  });

  $('#batch_volume, #type_fermentation, #original_gravity').on('change', function(e) {
    YEAST.type_fermentation = $('#type_fermentation').val();
    YEAST.batch_volume = $('#batch_volume').val();
    YEAST.original_gravity = $('#original_gravity').val();
    YEAST.pitching_rate(YEAST.type_fermentation, YEAST.original_gravity);
    YEAST.yeast_cells_need_calc(YEAST.batch_volume, YEAST.optimal_pitching_rate);
    $('#optimal_pitching_rate').val(YEAST.optimal_pitching_rate);
    $('#yeast_cells_needed').val(YEAST.yeast_cells_needed);
    $('.trigger').trigger('change');
  });

  $('#initial_cell_count, #viability').on('change', function(e) {
    YEAST.initial_cell_count = $('#initial_cell_count').val();
    YEAST.viability = $('#viability').val();
    YEAST.growth_calc(YEAST.initial_cell_count,YEAST.viability);
    $('#viable_cell_count').val(YEAST.viable_cell_count);
    $('.trigger').trigger('change');
  });


  $('.trigger').on('change', function(e) {
    var step = $(this).parents('fieldset').data('step');
    var starter_gravity = YEAST.format_density($('#starter_gravity_'+step).val());
    var volume = $('#starter_volume_'+step).val();
    var extract = starter_gravity / YEAST.dme;
    var base_initial_cells = YEAST.viable_cell_count;
    if(step > 1) {
      var base_initial_cells = $('#total_cells_at_finish_'+(step-1)).val();
    }
    var initial_cells = base_initial_cells / (extract * volume);

    if(initial_cells < 1.4) {
      growth_factor = 1.4;
    } else if(initial_cells >= 1.4 && initial_cells < 3.5) {
      growth_factor = (7/3) - ((2/3) * initial_cells);
    } else {
      growth_factor = 0;
    }
    new_cells = growth_factor * extract * volume;

    $('#new_cells_created_'+step).val(Math.round(new_cells));
    $('#growth_factor_'+step).val((new_cells / base_initial_cells).toPrecision(3));
    var total = Math.round(Number(new_cells) + Number(base_initial_cells));
    $('#total_cells_at_finish_'+step).val(total);
    if(total > YEAST.yeast_cells_needed) {
      $('#total_cells_at_finish_'+step).removeClass('nok').addClass('ok');
    } else {
      $('#total_cells_at_finish_'+step).removeClass('ok').addClass('nok');
    }
  });

  $('#batch_volume, #initial_cell_count, #starter_volume_1').trigger('change');

});